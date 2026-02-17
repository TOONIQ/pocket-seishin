"""delay cascade simulation"""

import click

from ..db import require_active_project, PHASES
from ..models import episode_get, sim_delay
from ..render import render_sim_delay, console


@click.group()
def sim():
    """シミュレーション"""
    pass


@sim.command()
@click.argument("ep_number", type=int)
@click.option("--phase", type=click.Choice(PHASES), required=True, help="遅延発生工程")
@click.option("--days", type=int, required=True, help="遅延日数")
def delay(ep_number, phase, days):
    """遅延カスケードをシミュレーション"""
    proj = require_active_project()
    ep = episode_get(proj["id"], ep_number)
    if not ep:
        raise click.ClickException(f"第{ep_number}話が見つからない")
    results = sim_delay(ep["id"], phase, days)
    render_sim_delay(results)
