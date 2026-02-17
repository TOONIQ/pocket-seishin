"""company add/list/show"""

import click

from ..models import company_add, company_list, company_get, company_get_by_name
from ..render import render_company_list, render_company_show, console


@click.group()
def company():
    """外注会社管理"""
    pass


@company.command()
@click.argument("name")
@click.option("--capabilities", default=None, help="対応工程 (カンマ区切り: niGen,douga)")
@click.option("--capacity", type=int, default=0, help="日産能力")
@click.option("--staff", type=int, default=0, help="スタッフ数")
@click.option("--quality", type=int, default=3, help="品質 (1-5)")
def add(name, capabilities, capacity, staff, quality):
    """外注会社を追加"""
    cid = company_add(name, capabilities, capacity, staff, quality)
    console.print(f"[green]{name} を追加 (ID: {cid})[/green]")


@company.command("list")
def list_cmd():
    """外注会社一覧"""
    companies = company_list()
    if not companies:
        console.print("[dim]外注会社なし[/dim]")
        return
    render_company_list(companies)


@company.command()
@click.argument("name_or_id")
def show(name_or_id):
    """外注会社詳細"""
    try:
        c = company_get(int(name_or_id))
    except ValueError:
        c = company_get_by_name(name_or_id)
    if not c:
        raise click.ClickException(f"会社「{name_or_id}」が見つからない")
    render_company_show(c)
