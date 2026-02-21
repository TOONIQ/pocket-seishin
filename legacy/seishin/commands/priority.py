"""priority list生成"""

import click

from ..db import require_active_project
from ..models import episode_get, priority_list
from ..render import render_priority_list, console


@click.command()
@click.argument("ep_number", type=int)
@click.option("--section", default=None, help="セクション (sakkan, enshutsu, douga, shiage, satsuei)")
def priority(ep_number, section):
    """優先カットリストを生成"""
    proj = require_active_project()
    ep = episode_get(proj["id"], ep_number)
    if not ep:
        raise click.ClickException(f"第{ep_number}話が見つからない")
    items = priority_list(ep["id"], section)
    if not items:
        console.print("[green]未完了カットなし[/green]")
        return
    render_priority_list(items)
