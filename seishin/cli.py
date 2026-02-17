"""Click group entry point"""

import click

from .db import init_db
from .commands.project import project
from .commands.episode import ep
from .commands.cut import cut
from .commands.creator import creator
from .commands.company import company
from .commands.order import order
from .commands.priority import priority
from .commands.sim import sim
from .commands.dashboard import dashboard


@click.group()
def cli():
    """制進 (seishin) - アニメ制作進行CLIツール"""
    init_db()


cli.add_command(project)
cli.add_command(ep)
cli.add_command(cut)
cli.add_command(creator)
cli.add_command(company)
cli.add_command(order)
cli.add_command(priority)
cli.add_command(sim)
cli.add_command(dashboard)


if __name__ == "__main__":
    cli()
