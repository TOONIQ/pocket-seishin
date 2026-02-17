"""Rich テーブル描画"""

from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.text import Text
from rich import box

from .db import PHASES

console = Console()

PHASE_SHORT = {
    "lo_raw": "LO原",
    "lo_enshutsu": "LO演",
    "lo_sakkan": "LO作",
    "genga_raw": "原画",
    "genga_enshutsu": "原演",
    "genga_sakkan": "原作",
    "douga": "動画",
    "shiage": "仕上",
    "satsuei": "撮影",
    "v_edit": "V編",
}

STATUS_STYLE = {
    "pending": "dim",
    "in_progress": "cyan bold",
    "completed": "green",
    "retake": "red bold",
    "delayed": "yellow bold",
}

STATUS_ICON = {
    "pending": "·",
    "in_progress": "▶",
    "completed": "✓",
    "retake": "✗",
    "delayed": "!",
}


def render_project_list(projects: list[dict]):
    table = Table(title="プロジェクト一覧", box=box.ROUNDED)
    table.add_column("ID", style="dim")
    table.add_column("作品名", style="bold")
    table.add_column("略称")
    table.add_column("話数")
    for p in projects:
        table.add_row(str(p["id"]), p["name"], p["short_name"] or "-", str(p["total_episodes"]))
    console.print(table)


def render_episode_list(episodes: list[dict]):
    table = Table(title="話数一覧", box=box.ROUNDED)
    table.add_column("#", style="dim")
    table.add_column("タイトル")
    table.add_column("放送日")
    table.add_column("V編日")
    for ep in episodes:
        table.add_row(
            str(ep["number"]),
            ep["title"] or "-",
            ep["air_date"] or "-",
            ep["v_edit_date"] or "-",
        )
    console.print(table)


def render_episode_show(ep: dict):
    console.print(Panel(
        f"[bold]第{ep['number']}話[/bold] {ep.get('title') or ''}\n"
        f"放送日: {ep.get('air_date') or '未定'}  V編日: {ep.get('v_edit_date') or '未定'}\n"
        f"カット数: {ep['total_cuts']}",
        title=f"Episode {ep['number']}",
    ))
    if ep.get("phase_stats"):
        table = Table(box=box.SIMPLE)
        table.add_column("工程")
        table.add_column("完了", justify="right")
        table.add_column("遅延", justify="right")
        table.add_column("リテイク", justify="right")
        for phase in PHASES:
            s = ep["phase_stats"][phase]
            total = s["total"]
            done = s["done"]
            table.add_row(
                PHASE_SHORT[phase],
                f"{done}/{total}" if total else "-",
                str(s["delayed"]) if s["delayed"] else "-",
                str(s["retake"]) if s["retake"] else "-",
            )
        console.print(table)


def render_cut_list(cuts: list[dict]):
    table = Table(title="カット一覧", box=box.ROUNDED)
    table.add_column("カット", style="bold")
    table.add_column("難易度", justify="center")
    table.add_column("優先", justify="center")
    table.add_column("現工程")
    table.add_column("進捗", justify="right")
    for c in cuts:
        diff_str = "★" * (c["difficulty"] or 3)
        pri = "◉" if c["is_priority"] else ""
        phase = PHASE_SHORT.get(c["current_phase"], c["current_phase"] or "完了")
        done = c["completed_phases"] or 0
        table.add_row(c["number"], diff_str, pri, phase, f"{done}/{len(PHASES)}")
    console.print(table)


def render_cut_show(cut: dict):
    console.print(Panel(
        f"[bold]{cut['number']}[/bold]  難易度: {'★' * (cut['difficulty'] or 3)}"
        + (f"  [red]優先[/red]: {cut['priority_reason']}" if cut["is_priority"] else ""),
        title=f"カット {cut['number']}",
    ))
    table = Table(box=box.SIMPLE)
    table.add_column("工程")
    table.add_column("状態")
    table.add_column("担当")
    table.add_column("締切")
    for p in cut["phases"]:
        style = STATUS_STYLE.get(p["status"], "")
        icon = STATUS_ICON.get(p["status"], "")
        table.add_row(
            PHASE_SHORT.get(p["phase"], p["phase"]),
            Text(f"{icon} {p['status']}", style=style),
            p.get("assignee_name") or "-",
            p.get("deadline") or "-",
        )
    console.print(table)


def render_cut_board(board: dict):
    """Render a kanban-style board of all phases."""
    table = Table(title="カット工程ボード", box=box.ROUNDED, show_lines=True)
    table.add_column("工程", style="bold", width=8)
    table.add_column("完了", style="green", justify="right", width=5)
    table.add_column("作業中", style="cyan", width=30)
    table.add_column("遅延/RT", style="red", width=20)
    table.add_column("待ち", style="dim", justify="right", width=5)

    for phase in PHASES:
        cuts = board.get(phase, [])
        done = sum(1 for c in cuts if c["status"] == "completed")
        in_prog = [c for c in cuts if c["status"] == "in_progress"]
        delayed = [c for c in cuts if c["status"] in ("delayed", "retake")]
        pending = sum(1 for c in cuts if c["status"] == "pending")

        in_prog_str = ", ".join(
            f"{c['number']}({c['assignee_name'] or '?'})" for c in in_prog[:5]
        )
        if len(in_prog) > 5:
            in_prog_str += f" +{len(in_prog)-5}"

        delayed_str = ", ".join(c["number"] for c in delayed[:5])
        if len(delayed) > 5:
            delayed_str += f" +{len(delayed)-5}"

        table.add_row(
            PHASE_SHORT[phase],
            str(done),
            in_prog_str or "-",
            delayed_str or "-",
            str(pending),
        )
    console.print(table)


def render_creator_list(creators: list[dict]):
    table = Table(title="クリエイター一覧", box=box.ROUNDED)
    table.add_column("ID", style="dim")
    table.add_column("名前", style="bold")
    table.add_column("カテゴリ")
    table.add_column("スキル")
    table.add_column("速度", justify="center")
    table.add_column("品質", justify="center")
    table.add_column("単価", justify="right")
    for c in creators:
        table.add_row(
            str(c["id"]), c["name"], c["category"] or "-",
            c["skills"] or "-",
            "★" * c["speed_rating"], "★" * c["quality_rating"],
            f"¥{c['price_per_cut']:,}" if c["price_per_cut"] else "-",
        )
    console.print(table)


def render_creator_show(creator: dict):
    console.print(Panel(
        f"[bold]{creator['name']}[/bold]\n"
        f"カテゴリ: {creator['category'] or '-'}  スキル: {creator['skills'] or '-'}\n"
        f"速度: {'★' * creator['speed_rating']}  品質: {'★' * creator['quality_rating']}\n"
        f"単価: ¥{creator['price_per_cut']:,}  "
        f"日産: {creator['daily_capacity'] or '-'}カット\n"
        f"締切遵守: {'○' if creator['pulls_deadline'] else '×'}",
        title=f"クリエイター #{creator['id']}",
    ))


def render_company_list(companies: list[dict]):
    table = Table(title="外注会社一覧", box=box.ROUNDED)
    table.add_column("ID", style="dim")
    table.add_column("会社名", style="bold")
    table.add_column("対応工程")
    table.add_column("日産能力", justify="right")
    table.add_column("人数", justify="right")
    table.add_column("品質", justify="center")
    for c in companies:
        table.add_row(
            str(c["id"]), c["name"], c["capabilities"] or "-",
            str(c["capacity_per_day"]), str(c["num_staff"]),
            "★" * c["quality_rating"],
        )
    console.print(table)


def render_company_show(company: dict):
    console.print(Panel(
        f"[bold]{company['name']}[/bold]\n"
        f"対応工程: {company['capabilities'] or '-'}\n"
        f"日産能力: {company['capacity_per_day']}カット  "
        f"スタッフ: {company['num_staff']}人\n"
        f"品質: {'★' * company['quality_rating']}\n"
        f"連絡先: {company.get('contact') or '-'}",
        title=f"会社 #{company['id']}",
    ))


def render_order_list(orders: list[dict]):
    table = Table(title="発注書一覧", box=box.ROUNDED)
    table.add_column("ID", style="dim")
    table.add_column("工程")
    table.add_column("カット")
    table.add_column("合計", justify="right")
    table.add_column("締切")
    table.add_column("状態")
    for o in orders:
        cuts = o["cut_numbers"]
        if len(cuts) > 20:
            cuts = cuts[:20] + "..."
        style = {"draft": "dim", "issued": "cyan", "accepted": "green", "completed": "green bold"}.get(o["status"], "")
        table.add_row(
            str(o["id"]),
            PHASE_SHORT.get(o["phase"], o["phase"]),
            cuts,
            f"¥{o['total_price']:,}",
            o["deadline"] or "-",
            Text(o["status"], style=style),
        )
    console.print(table)


def render_priority_list(items: list[dict]):
    table = Table(title="優先カットリスト", box=box.ROUNDED)
    table.add_column("#", style="dim")
    table.add_column("カット", style="bold")
    table.add_column("工程")
    table.add_column("状態")
    table.add_column("難易度", justify="center")
    table.add_column("担当")
    table.add_column("締切")
    table.add_column("理由")
    for i, item in enumerate(items, 1):
        style = STATUS_STYLE.get(item["status"], "")
        icon = STATUS_ICON.get(item["status"], "")
        table.add_row(
            str(i),
            item["number"],
            PHASE_SHORT.get(item["phase"], item["phase"]),
            Text(f"{icon} {item['status']}", style=style),
            "★" * (item["difficulty"] or 3),
            item.get("assignee_name") or "-",
            item.get("deadline") or "-",
            item.get("priority_reason") or "-",
        )
    console.print(table)


def render_sim_delay(results: list[dict]):
    if not results:
        console.print("[green]遅延の影響なし[/green]")
        return
    console.print(Panel("[bold red]遅延カスケード シミュレーション結果[/bold red]"))
    for r in results:
        console.print(
            f"  [yellow]{PHASE_SHORT.get(r['phase'], r['phase'])}[/yellow] "
            f"→ [red]{r['delay_days']}日遅延[/red] "
            f"({r['affected_cuts']}カット影響)"
        )
    total = sum(r["affected_cuts"] for r in results)
    console.print(f"\n  [bold]影響総数: {total}カット×工程[/bold]")


def render_dashboard(data: dict, project_name: str):
    console.print(Panel(
        f"[bold]{project_name}[/bold]  "
        f"未割当: [yellow]{data['unassigned_phases']}[/yellow]  "
        f"遅延: [red]{data['delayed_phases']}[/red]",
        title="ダッシュボード",
    ))

    for ep in data["episodes"]:
        e = ep["episode"]
        table = Table(
            title=f"第{e['number']}話 {e.get('title') or ''}  (全{ep['total_cuts']}カット)",
            box=box.SIMPLE,
        )
        table.add_column("工程", width=8)
        table.add_column("進捗バー", width=30)
        table.add_column("完了", justify="right", width=8)
        table.add_column("遅延", justify="right", width=5)

        for phase in PHASES:
            s = ep["phases"][phase]
            total = s["total"]
            done = s["done"]
            delayed = s["delayed"]
            if total > 0:
                pct = done / total
                bar_len = 20
                filled = int(pct * bar_len)
                bar = "█" * filled + "░" * (bar_len - filled)
                pct_str = f"{pct*100:.0f}%"
            else:
                bar = "-"
                pct_str = "-"
            table.add_row(
                PHASE_SHORT[phase],
                f"[green]{bar}[/green] {pct_str}",
                f"{done}/{total}" if total else "-",
                str(delayed) if delayed else "-",
            )
        console.print(table)
