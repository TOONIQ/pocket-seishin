"""ep add/list/show"""

import click

from ..db import require_active_project
from ..models import episode_add, episode_list, episode_show
from ..render import render_episode_list, render_episode_show, console


@click.group()
def ep():
    """話数管理"""
    pass


@ep.command()
@click.argument("number", type=int)
@click.option("--title", default=None, help="サブタイトル")
@click.option("--air-date", default=None, help="放送日 (YYYY-MM-DD)")
@click.option("--v-edit-date", default=None, help="V編集日 (YYYY-MM-DD)")
def add(number, title, air_date, v_edit_date):
    """話数を追加"""
    proj = require_active_project()
    eid = episode_add(proj["id"], number, title, air_date, v_edit_date)
    console.print(f"[green]第{number}話を追加 (ID: {eid})[/green]")


@ep.command("list")
def list_cmd():
    """話数一覧"""
    proj = require_active_project()
    episodes = episode_list(proj["id"])
    if not episodes:
        console.print("[dim]話数なし[/dim]")
        return
    render_episode_list(episodes)


@ep.command()
@click.argument("number", type=int)
def show(number):
    """話数の詳細表示"""
    proj = require_active_project()
    ep_data = episode_show(proj["id"], number)
    if not ep_data:
        raise click.ClickException(f"第{number}話が見つからない")
    render_episode_show(ep_data)
