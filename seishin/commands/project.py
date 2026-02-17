"""project add/list/switch"""

import click

from ..db import set_active_project, get_active_project
from ..models import project_add, project_list, project_get_by_name
from ..render import render_project_list, console


@click.group()
def project():
    """作品管理"""
    pass


@project.command()
@click.argument("name")
@click.option("--short", default=None, help="略称")
@click.option("--episodes", default=12, help="話数")
def add(name, short, episodes):
    """作品を追加"""
    pid = project_add(name, short, episodes)
    set_active_project(pid, name)
    console.print(f"[green]作品「{name}」を追加 (ID: {pid})[/green]")
    console.print(f"[dim]アクティブプロジェクトに設定済み[/dim]")


@project.command("list")
def list_cmd():
    """作品一覧"""
    projects = project_list()
    if not projects:
        console.print("[dim]作品なし[/dim]")
        return
    active = get_active_project()
    render_project_list(projects)
    if active:
        console.print(f"\n[cyan]アクティブ: {active['name']}[/cyan]")


@project.command()
@click.argument("name")
def switch(name):
    """アクティブプロジェクトを切り替え"""
    p = project_get_by_name(name)
    if not p:
        raise click.ClickException(f"作品「{name}」が見つからない")
    set_active_project(p["id"], p["name"])
    console.print(f"[green]アクティブ: {p['name']}[/green]")
