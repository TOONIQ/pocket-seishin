"""データアクセス層 (raw SQL)"""

from .db import get_conn, PHASES


# ── Project ──────────────────────────────────────────

def project_add(name: str, short_name: str | None, total_episodes: int) -> int:
    conn = get_conn()
    cur = conn.execute(
        "INSERT INTO project (name, short_name, total_episodes) VALUES (?, ?, ?)",
        (name, short_name, total_episodes),
    )
    conn.commit()
    pid = cur.lastrowid
    conn.close()
    return pid


def project_list() -> list[dict]:
    conn = get_conn()
    rows = conn.execute("SELECT * FROM project ORDER BY id").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def project_get_by_name(name: str) -> dict | None:
    conn = get_conn()
    row = conn.execute("SELECT * FROM project WHERE name = ?", (name,)).fetchone()
    conn.close()
    return dict(row) if row else None


# ── Episode ──────────────────────────────────────────

def episode_add(project_id: int, number: int, title: str | None,
                air_date: str | None, v_edit_date: str | None) -> int:
    conn = get_conn()
    cur = conn.execute(
        "INSERT INTO episode (project_id, number, title, air_date, v_edit_date) VALUES (?, ?, ?, ?, ?)",
        (project_id, number, title, air_date, v_edit_date),
    )
    conn.commit()
    eid = cur.lastrowid
    conn.close()
    return eid


def episode_list(project_id: int) -> list[dict]:
    conn = get_conn()
    rows = conn.execute(
        "SELECT * FROM episode WHERE project_id = ? ORDER BY number", (project_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def episode_get(project_id: int, number: int) -> dict | None:
    conn = get_conn()
    row = conn.execute(
        "SELECT * FROM episode WHERE project_id = ? AND number = ?",
        (project_id, number),
    ).fetchone()
    conn.close()
    return dict(row) if row else None


def episode_show(project_id: int, number: int) -> dict | None:
    """Episode with cut/phase stats."""
    ep = episode_get(project_id, number)
    if not ep:
        return None
    conn = get_conn()
    total = conn.execute(
        "SELECT COUNT(*) FROM cut WHERE episode_id = ?", (ep["id"],)
    ).fetchone()[0]
    # Phase completion stats
    stats = {}
    for phase in PHASES:
        row = conn.execute(
            """SELECT
                COUNT(*) as total,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as done,
                SUM(CASE WHEN status = 'delayed' THEN 1 ELSE 0 END) as delayed,
                SUM(CASE WHEN status = 'retake' THEN 1 ELSE 0 END) as retake
            FROM cut_phase
            JOIN cut ON cut.id = cut_phase.cut_id
            WHERE cut.episode_id = ? AND cut_phase.phase = ?""",
            (ep["id"], phase),
        ).fetchone()
        stats[phase] = dict(row)
    conn.close()
    ep["total_cuts"] = total
    ep["phase_stats"] = stats
    return ep


# ── Cut ──────────────────────────────────────────────

def parse_cut_range(spec: str) -> list[str]:
    """Parse cut spec like 'C001-C010' or 'C001,C002,C003' into list."""
    spec = spec.strip()
    if "-" in spec and spec.count("-") == 1:
        parts = spec.split("-")
        prefix_start = ""
        num_start = ""
        for i, c in enumerate(parts[0]):
            if c.isdigit():
                prefix_start = parts[0][:i]
                num_start = parts[0][i:]
                break
        prefix_end = ""
        num_end = ""
        for i, c in enumerate(parts[1]):
            if c.isdigit():
                prefix_end = parts[1][:i]
                num_end = parts[1][i:]
                break
        prefix = prefix_start or prefix_end or "C"
        start = int(num_start)
        end = int(num_end)
        width = len(num_start)
        return [f"{prefix}{str(i).zfill(width)}" for i in range(start, end + 1)]
    elif "," in spec:
        return [s.strip() for s in spec.split(",")]
    else:
        return [spec]


def cut_add(episode_id: int, numbers: list[str]) -> int:
    """Add cuts with all phase entries. Returns count added."""
    conn = get_conn()
    count = 0
    for num in numbers:
        try:
            cur = conn.execute(
                "INSERT INTO cut (episode_id, number) VALUES (?, ?)",
                (episode_id, num),
            )
            cut_id = cur.lastrowid
            for phase in PHASES:
                conn.execute(
                    "INSERT INTO cut_phase (cut_id, phase) VALUES (?, ?)",
                    (cut_id, phase),
                )
            count += 1
        except Exception:
            pass  # Skip duplicates
    conn.commit()
    conn.close()
    return count


def cut_list(episode_id: int) -> list[dict]:
    conn = get_conn()
    rows = conn.execute(
        """SELECT c.*,
            (SELECT cp.phase FROM cut_phase cp
             WHERE cp.cut_id = c.id AND cp.status IN ('in_progress', 'pending')
             ORDER BY CASE cp.phase
                WHEN 'lo_raw' THEN 1 WHEN 'lo_enshutsu' THEN 2 WHEN 'lo_sakkan' THEN 3
                WHEN 'genga_raw' THEN 4 WHEN 'genga_enshutsu' THEN 5 WHEN 'genga_sakkan' THEN 6
                WHEN 'douga' THEN 7 WHEN 'shiage' THEN 8 WHEN 'satsuei' THEN 9 WHEN 'v_edit' THEN 10
             END LIMIT 1) as current_phase,
            (SELECT COUNT(*) FROM cut_phase cp WHERE cp.cut_id = c.id AND cp.status = 'completed') as completed_phases
        FROM cut c WHERE c.episode_id = ? ORDER BY c.number""",
        (episode_id,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def cut_get(episode_id: int, number: str) -> dict | None:
    conn = get_conn()
    row = conn.execute(
        "SELECT * FROM cut WHERE episode_id = ? AND number = ?",
        (episode_id, number),
    ).fetchone()
    if not row:
        conn.close()
        return None
    cut = dict(row)
    phases = conn.execute(
        """SELECT cp.*, cr.name as assignee_name
        FROM cut_phase cp
        LEFT JOIN creator cr ON cr.id = cp.assignee_id
        WHERE cp.cut_id = ?
        ORDER BY CASE cp.phase
            WHEN 'lo_raw' THEN 1 WHEN 'lo_enshutsu' THEN 2 WHEN 'lo_sakkan' THEN 3
            WHEN 'genga_raw' THEN 4 WHEN 'genga_enshutsu' THEN 5 WHEN 'genga_sakkan' THEN 6
            WHEN 'douga' THEN 7 WHEN 'shiage' THEN 8 WHEN 'satsuei' THEN 9 WHEN 'v_edit' THEN 10
        END""",
        (cut["id"],),
    ).fetchall()
    cut["phases"] = [dict(p) for p in phases]
    conn.close()
    return cut


def cut_update_phase(episode_id: int, cut_number: str, phase: str,
                     status: str | None = None, assignee_id: int | None = None,
                     deadline: str | None = None) -> bool:
    conn = get_conn()
    cut_row = conn.execute(
        "SELECT id FROM cut WHERE episode_id = ? AND number = ?",
        (episode_id, cut_number),
    ).fetchone()
    if not cut_row:
        conn.close()
        return False

    sets = []
    params = []
    if status:
        sets.append("status = ?")
        params.append(status)
        if status == "in_progress":
            sets.append("started_at = datetime('now')")
        elif status == "completed":
            sets.append("completed_at = datetime('now')")
    if assignee_id is not None:
        sets.append("assignee_id = ?")
        params.append(assignee_id)
    if deadline:
        sets.append("deadline = ?")
        params.append(deadline)

    if not sets:
        conn.close()
        return False

    params.extend([cut_row["id"], phase])
    conn.execute(
        f"UPDATE cut_phase SET {', '.join(sets)} WHERE cut_id = ? AND phase = ?",
        params,
    )
    conn.commit()
    conn.close()
    return True


def cut_board(episode_id: int) -> dict:
    """Get cut board data: phase -> list of cuts with their status."""
    conn = get_conn()
    result = {}
    for phase in PHASES:
        rows = conn.execute(
            """SELECT c.number, cp.status, cr.name as assignee_name
            FROM cut_phase cp
            JOIN cut c ON c.id = cp.cut_id
            LEFT JOIN creator cr ON cr.id = cp.assignee_id
            WHERE c.episode_id = ? AND cp.phase = ?
            ORDER BY c.number""",
            (episode_id, phase),
        ).fetchall()
        result[phase] = [dict(r) for r in rows]
    conn.close()
    return result


# ── Creator ──────────────────────────────────────────

def creator_add(name: str, category: str | None, skills: str | None,
                speed: int, quality: int, price: int) -> int:
    conn = get_conn()
    cur = conn.execute(
        "INSERT INTO creator (name, category, skills, speed_rating, quality_rating, price_per_cut) VALUES (?, ?, ?, ?, ?, ?)",
        (name, category, skills, speed, quality, price),
    )
    conn.commit()
    cid = cur.lastrowid
    conn.close()
    return cid


def creator_list(skill_filter: str | None = None) -> list[dict]:
    conn = get_conn()
    if skill_filter:
        rows = conn.execute(
            "SELECT * FROM creator WHERE skills LIKE ? ORDER BY name",
            (f"%{skill_filter}%",),
        ).fetchall()
    else:
        rows = conn.execute("SELECT * FROM creator ORDER BY name").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def creator_get(creator_id: int) -> dict | None:
    conn = get_conn()
    row = conn.execute("SELECT * FROM creator WHERE id = ?", (creator_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def creator_get_by_name(name: str) -> dict | None:
    conn = get_conn()
    row = conn.execute(
        "SELECT * FROM creator WHERE name LIKE ?", (f"%{name}%",)
    ).fetchone()
    conn.close()
    return dict(row) if row else None


def creator_update(creator_id: int, **kwargs) -> bool:
    conn = get_conn()
    sets = []
    params = []
    for k, v in kwargs.items():
        if v is not None:
            sets.append(f"{k} = ?")
            params.append(v)
    if not sets:
        conn.close()
        return False
    params.append(creator_id)
    conn.execute(f"UPDATE creator SET {', '.join(sets)} WHERE id = ?", params)
    conn.commit()
    conn.close()
    return True


# ── Company ──────────────────────────────────────────

def company_add(name: str, capabilities: str | None, capacity: int,
                num_staff: int, quality: int) -> int:
    conn = get_conn()
    cur = conn.execute(
        "INSERT INTO company (name, capabilities, capacity_per_day, num_staff, quality_rating) VALUES (?, ?, ?, ?, ?)",
        (name, capabilities, capacity, num_staff, quality),
    )
    conn.commit()
    cid = cur.lastrowid
    conn.close()
    return cid


def company_list() -> list[dict]:
    conn = get_conn()
    rows = conn.execute("SELECT * FROM company ORDER BY name").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def company_get(company_id: int) -> dict | None:
    conn = get_conn()
    row = conn.execute("SELECT * FROM company WHERE id = ?", (company_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def company_get_by_name(name: str) -> dict | None:
    conn = get_conn()
    row = conn.execute(
        "SELECT * FROM company WHERE name LIKE ?", (f"%{name}%",)
    ).fetchone()
    conn.close()
    return dict(row) if row else None


# ── Order ────────────────────────────────────────────

def order_new(episode_id: int, phase: str, assignee_type: str,
              assignee_id: int, cut_numbers: str, price_per_cut: int,
              deadline: str | None) -> int:
    cuts = parse_cut_range(cut_numbers)
    total = price_per_cut * len(cuts)
    conn = get_conn()
    cur = conn.execute(
        """INSERT INTO "order" (episode_id, phase, assignee_type, assignee_id,
           cut_numbers, price_per_cut, total_price, deadline)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (episode_id, phase, assignee_type, assignee_id,
         ",".join(cuts), price_per_cut, total, deadline),
    )
    conn.commit()
    oid = cur.lastrowid
    conn.close()
    return oid


def order_list(episode_id: int | None = None) -> list[dict]:
    conn = get_conn()
    if episode_id:
        rows = conn.execute(
            'SELECT * FROM "order" WHERE episode_id = ? ORDER BY id', (episode_id,)
        ).fetchall()
    else:
        rows = conn.execute('SELECT * FROM "order" ORDER BY id').fetchall()
    conn.close()
    return [dict(r) for r in rows]


def order_get(order_id: int) -> dict | None:
    conn = get_conn()
    row = conn.execute('SELECT * FROM "order" WHERE id = ?', (order_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def order_issue(order_id: int) -> bool:
    conn = get_conn()
    conn.execute(
        """UPDATE "order" SET status = 'issued', issued_at = datetime('now')
        WHERE id = ?""",
        (order_id,),
    )
    conn.commit()
    conn.close()
    return True


# ── Priority ─────────────────────────────────────────

def priority_list(episode_id: int, section: str | None = None) -> list[dict]:
    """Generate priority-sorted cut list for a section (e.g., sakkan)."""
    conn = get_conn()
    phase_filter = ""
    params = [episode_id]
    if section:
        # Map section names to phases
        section_phases = {
            "sakkan": ("lo_sakkan", "genga_sakkan"),
            "enshutsu": ("lo_enshutsu", "genga_enshutsu"),
            "douga": ("douga",),
            "shiage": ("shiage",),
            "satsuei": ("satsuei",),
        }
        phases = section_phases.get(section, (section,))
        placeholders = ",".join("?" * len(phases))
        phase_filter = f"AND cp.phase IN ({placeholders})"
        params.extend(phases)

    rows = conn.execute(
        f"""SELECT c.number, c.difficulty, c.is_priority, c.priority_reason,
            cp.phase, cp.status, cp.deadline, cr.name as assignee_name
        FROM cut c
        JOIN cut_phase cp ON cp.cut_id = c.id
        LEFT JOIN creator cr ON cr.id = cp.assignee_id
        WHERE c.episode_id = ?
        {phase_filter}
        AND cp.status IN ('pending', 'in_progress', 'retake', 'delayed')
        ORDER BY
            c.is_priority DESC,
            CASE WHEN cp.status = 'delayed' THEN 0
                 WHEN cp.status = 'retake' THEN 1
                 WHEN cp.status = 'in_progress' THEN 2
                 ELSE 3 END,
            c.difficulty DESC,
            cp.deadline ASC NULLS LAST,
            c.number ASC""",
        params,
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ── Simulation ───────────────────────────────────────

def sim_delay(episode_id: int, phase: str, days: int) -> list[dict]:
    """Simulate cascade delay from a phase delay."""
    phase_idx = PHASES.index(phase)
    downstream = PHASES[phase_idx:]

    conn = get_conn()
    results = []
    for i, p in enumerate(downstream):
        delay_days = days - i  # Each downstream phase absorbs 1 day
        if delay_days <= 0:
            break
        rows = conn.execute(
            """SELECT c.number, cp.phase, cp.status, cp.deadline
            FROM cut_phase cp
            JOIN cut c ON c.id = cp.cut_id
            WHERE c.episode_id = ? AND cp.phase = ?
            AND cp.status != 'completed'""",
            (episode_id, p),
        ).fetchall()
        affected = [dict(r) for r in rows]
        if affected:
            results.append({
                "phase": p,
                "delay_days": delay_days,
                "affected_cuts": len(affected),
                "cuts": affected,
            })
    conn.close()
    return results


# ── Dashboard ────────────────────────────────────────

def dashboard_data(project_id: int) -> dict:
    conn = get_conn()
    episodes = conn.execute(
        "SELECT * FROM episode WHERE project_id = ? ORDER BY number",
        (project_id,),
    ).fetchall()

    ep_data = []
    for ep in episodes:
        total = conn.execute(
            "SELECT COUNT(*) FROM cut WHERE episode_id = ?", (ep["id"],)
        ).fetchone()[0]

        phase_summary = {}
        for phase in PHASES:
            row = conn.execute(
                """SELECT
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as done,
                    SUM(CASE WHEN status = 'delayed' THEN 1 ELSE 0 END) as delayed
                FROM cut_phase cp
                JOIN cut c ON c.id = cp.cut_id
                WHERE c.episode_id = ? AND cp.phase = ?""",
                (ep["id"], phase),
            ).fetchone()
            phase_summary[phase] = dict(row)

        ep_data.append({
            "episode": dict(ep),
            "total_cuts": total,
            "phases": phase_summary,
        })

    # Unassigned work
    unassigned = conn.execute(
        """SELECT COUNT(*) FROM cut_phase cp
        JOIN cut c ON c.id = cp.cut_id
        JOIN episode e ON e.id = c.episode_id
        WHERE e.project_id = ? AND cp.assignee_id IS NULL
        AND cp.status IN ('pending', 'in_progress')""",
        (project_id,),
    ).fetchone()[0]

    # Delayed count
    delayed = conn.execute(
        """SELECT COUNT(*) FROM cut_phase cp
        JOIN cut c ON c.id = cp.cut_id
        JOIN episode e ON e.id = c.episode_id
        WHERE e.project_id = ? AND cp.status = 'delayed'""",
        (project_id,),
    ).fetchone()[0]

    conn.close()
    return {
        "episodes": ep_data,
        "unassigned_phases": unassigned,
        "delayed_phases": delayed,
    }
