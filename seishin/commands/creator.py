"""creator add/list/show/update"""

import click

from ..models import creator_add, creator_list, creator_get, creator_update, creator_get_by_name
from ..render import render_creator_list, render_creator_show, console


@click.group()
def creator():
    """クリエイター管理"""
    pass


@creator.command()
@click.argument("name")
@click.option("--category", default=None, help="カテゴリ (animator, douga, shiage, etc)")
@click.option("--skills", default=None, help="スキル (カンマ区切り: action,mecha)")
@click.option("--speed", type=int, default=3, help="速度 (1-5)")
@click.option("--quality", type=int, default=3, help="品質 (1-5)")
@click.option("--price", type=int, default=0, help="カット単価")
def add(name, category, skills, speed, quality, price):
    """クリエイターを追加"""
    cid = creator_add(name, category, skills, speed, quality, price)
    console.print(f"[green]{name} を追加 (ID: {cid})[/green]")


@creator.command("list")
@click.option("--skill", default=None, help="スキルでフィルタ")
def list_cmd(skill):
    """クリエイター一覧"""
    creators = creator_list(skill)
    if not creators:
        console.print("[dim]クリエイターなし[/dim]")
        return
    render_creator_list(creators)


@creator.command()
@click.argument("name_or_id")
def show(name_or_id):
    """クリエイター詳細"""
    try:
        c = creator_get(int(name_or_id))
    except ValueError:
        c = creator_get_by_name(name_or_id)
    if not c:
        raise click.ClickException(f"クリエイター「{name_or_id}」が見つからない")
    render_creator_show(c)


@creator.command()
@click.argument("name_or_id")
@click.option("--speed", type=int, default=None)
@click.option("--quality", type=int, default=None)
@click.option("--price", type=int, default=None)
@click.option("--skills", default=None)
@click.option("--daily-capacity", type=int, default=None)
@click.option("--pulls-deadline", type=bool, default=None)
def update(name_or_id, speed, quality, price, skills, daily_capacity, pulls_deadline):
    """クリエイター情報を更新"""
    try:
        c = creator_get(int(name_or_id))
    except ValueError:
        c = creator_get_by_name(name_or_id)
    if not c:
        raise click.ClickException(f"クリエイター「{name_or_id}」が見つからない")

    kwargs = {}
    if speed is not None:
        kwargs["speed_rating"] = speed
    if quality is not None:
        kwargs["quality_rating"] = quality
    if price is not None:
        kwargs["price_per_cut"] = price
    if skills is not None:
        kwargs["skills"] = skills
    if daily_capacity is not None:
        kwargs["daily_capacity"] = daily_capacity
    if pulls_deadline is not None:
        kwargs["pulls_deadline"] = pulls_deadline

    if not kwargs:
        console.print("[dim]更新項目なし[/dim]")
        return

    creator_update(c["id"], **kwargs)
    console.print(f"[green]{c['name']} を更新[/green]")
