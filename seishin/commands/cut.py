"""cut add/list/update/board/show"""

import click

from ..db import require_active_project, PHASES, STATUSES
from ..models import (
    episode_get, cut_add, cut_list, cut_get,
    cut_update_phase, cut_board, parse_cut_range,
)
from ..render import render_cut_list, render_cut_show, render_cut_board, console


def _get_episode(number: int) -> dict:
    proj = require_active_project()
    ep = episode_get(proj["id"], number)
    if not ep:
        raise click.ClickException(f"第{number}話が見つからない")
    return ep


@click.group()
def cut():
    """カット管理"""
    pass


@cut.command()
@click.argument("ep_number", type=int)
@click.argument("cut_spec")
@click.option("--difficulty", type=int, default=3, help="難易度 (1-5)")
def add(ep_number, cut_spec, difficulty):
    """カットを追加 (例: C001-C300, C001,C002)"""
    ep = _get_episode(ep_number)
    numbers = parse_cut_range(cut_spec)
    count = cut_add(ep["id"], numbers)
    console.print(f"[green]{count}カット追加 (第{ep_number}話)[/green]")


@cut.command("list")
@click.argument("ep_number", type=int)
def list_cmd(ep_number):
    """カット一覧"""
    ep = _get_episode(ep_number)
    cuts = cut_list(ep["id"])
    if not cuts:
        console.print("[dim]カットなし[/dim]")
        return
    render_cut_list(cuts)


@cut.command()
@click.argument("ep_number", type=int)
@click.argument("cut_number")
def show(ep_number, cut_number):
    """カット詳細表示"""
    ep = _get_episode(ep_number)
    c = cut_get(ep["id"], cut_number)
    if not c:
        raise click.ClickException(f"カット {cut_number} が見つからない")
    render_cut_show(c)


@cut.command()
@click.argument("ep_number", type=int)
@click.argument("cut_number")
@click.option("--phase", type=click.Choice(PHASES), required=True, help="工程")
@click.option("--status", type=click.Choice(STATUSES), default=None, help="状態")
@click.option("--assignee", type=int, default=None, help="担当者ID")
@click.option("--deadline", default=None, help="締切 (YYYY-MM-DD)")
def update(ep_number, cut_number, phase, status, assignee, deadline):
    """カットの工程状態を更新"""
    ep = _get_episode(ep_number)
    ok = cut_update_phase(ep["id"], cut_number, phase, status, assignee, deadline)
    if not ok:
        raise click.ClickException(f"カット {cut_number} / 工程 {phase} の更新に失敗")
    console.print(f"[green]{cut_number} {phase} 更新完了[/green]")


@cut.command()
@click.argument("ep_number", type=int)
def board(ep_number):
    """工程別ボード表示"""
    ep = _get_episode(ep_number)
    data = cut_board(ep["id"])
    render_cut_board(data)
