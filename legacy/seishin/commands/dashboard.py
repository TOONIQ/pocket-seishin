"""全体ダッシュボード"""

import click

from ..db import require_active_project
from ..models import dashboard_data
from ..render import render_dashboard


@click.command()
def dashboard():
    """全体ダッシュボードを表示"""
    proj = require_active_project()
    data = dashboard_data(proj["id"])
    render_dashboard(data, proj["name"])
