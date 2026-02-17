"""SQLite接続 + マイグレーション"""

import json
import sqlite3
from pathlib import Path

SEISHIN_DIR = Path.home() / ".seishin"
DB_PATH = SEISHIN_DIR / "seishin.db"
CONFIG_PATH = SEISHIN_DIR / "config.json"

PHASES = [
    "lo_raw", "lo_enshutsu", "lo_sakkan",
    "genga_raw", "genga_enshutsu", "genga_sakkan",
    "douga", "shiage", "satsuei", "v_edit",
]

STATUSES = ["pending", "in_progress", "completed", "retake", "delayed"]

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS project (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    short_name TEXT,
    total_episodes INTEGER DEFAULT 12,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS episode (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES project(id),
    number INTEGER NOT NULL,
    title TEXT,
    air_date TEXT,
    v_edit_date TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, number)
);

CREATE TABLE IF NOT EXISTS cut (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    episode_id INTEGER NOT NULL REFERENCES episode(id),
    number TEXT NOT NULL,
    difficulty INTEGER DEFAULT 3 CHECK(difficulty BETWEEN 1 AND 5),
    is_priority BOOLEAN DEFAULT 0,
    priority_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(episode_id, number)
);

CREATE TABLE IF NOT EXISTS cut_phase (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cut_id INTEGER NOT NULL REFERENCES cut(id),
    phase TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    assignee_id INTEGER REFERENCES creator(id),
    deadline TEXT,
    started_at TEXT,
    completed_at TEXT,
    UNIQUE(cut_id, phase)
);

CREATE TABLE IF NOT EXISTS creator (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT,
    skills TEXT,
    speed_rating INTEGER DEFAULT 3 CHECK(speed_rating BETWEEN 1 AND 5),
    quality_rating INTEGER DEFAULT 3 CHECK(quality_rating BETWEEN 1 AND 5),
    pulls_deadline BOOLEAN DEFAULT 0,
    daily_capacity INTEGER DEFAULT 0,
    price_per_cut INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS company (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    capabilities TEXT,
    capacity_per_day INTEGER DEFAULT 0,
    num_staff INTEGER DEFAULT 0,
    quality_rating INTEGER DEFAULT 3 CHECK(quality_rating BETWEEN 1 AND 5),
    contact TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "order" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    episode_id INTEGER NOT NULL REFERENCES episode(id),
    phase TEXT NOT NULL,
    cut_numbers TEXT NOT NULL,
    assignee_type TEXT NOT NULL CHECK(assignee_type IN ('creator', 'company')),
    assignee_id INTEGER NOT NULL,
    price_per_cut INTEGER DEFAULT 0,
    total_price INTEGER DEFAULT 0,
    deadline TEXT,
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'issued', 'accepted', 'completed')),
    issued_at TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS work_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    creator_id INTEGER REFERENCES creator(id),
    episode_id INTEGER REFERENCES episode(id),
    phase TEXT,
    cuts_completed INTEGER DEFAULT 0,
    sheets_completed INTEGER DEFAULT 0,
    started_at TEXT,
    completed_at TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""


def ensure_dir():
    SEISHIN_DIR.mkdir(parents=True, exist_ok=True)


def get_conn() -> sqlite3.Connection:
    ensure_dir()
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    conn = get_conn()
    conn.executescript(SCHEMA_SQL)
    conn.commit()
    conn.close()


def get_active_project() -> dict | None:
    if not CONFIG_PATH.exists():
        return None
    data = json.loads(CONFIG_PATH.read_text())
    return data.get("active_project")


def set_active_project(project_id: int, project_name: str):
    ensure_dir()
    config = {}
    if CONFIG_PATH.exists():
        config = json.loads(CONFIG_PATH.read_text())
    config["active_project"] = {"id": project_id, "name": project_name}
    CONFIG_PATH.write_text(json.dumps(config, ensure_ascii=False, indent=2))


def require_active_project() -> dict:
    proj = get_active_project()
    if not proj:
        import click
        raise click.ClickException(
            "アクティブプロジェクトが未設定。`seishin project switch <name>` で設定して"
        )
    return proj
