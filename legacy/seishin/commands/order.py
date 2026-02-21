"""order new/list/export"""

import click
from pathlib import Path

from ..db import require_active_project
from ..models import (
    episode_get, order_new, order_list, order_get, order_issue,
    creator_get, creator_get_by_name, company_get, company_get_by_name,
)
from ..render import render_order_list, console


@click.group()
def order():
    """発注書管理"""
    pass


@order.command()
@click.argument("ep_number", type=int)
@click.option("--phase", required=True, help="工程")
@click.option("--creator", "assignee_name", default=None, help="担当クリエイター名")
@click.option("--company", "company_name", default=None, help="担当会社名")
@click.option("--cuts", required=True, help="カット番号 (C042-C050)")
@click.option("--price", type=int, default=0, help="カット単価")
@click.option("--deadline", default=None, help="納期 (YYYY-MM-DD)")
def new(ep_number, phase, assignee_name, company_name, cuts, price, deadline):
    """発注書を作成"""
    proj = require_active_project()
    ep = episode_get(proj["id"], ep_number)
    if not ep:
        raise click.ClickException(f"第{ep_number}話が見つからない")

    if assignee_name:
        c = creator_get_by_name(assignee_name)
        if not c:
            raise click.ClickException(f"クリエイター「{assignee_name}」が見つからない")
        assignee_type = "creator"
        assignee_id = c["id"]
        if price == 0 and c["price_per_cut"]:
            price = c["price_per_cut"]
    elif company_name:
        c = company_get_by_name(company_name)
        if not c:
            raise click.ClickException(f"会社「{company_name}」が見つからない")
        assignee_type = "company"
        assignee_id = c["id"]
    else:
        raise click.ClickException("--creator か --company を指定して")

    oid = order_new(ep["id"], phase, assignee_type, assignee_id, cuts, price, deadline)
    console.print(f"[green]発注書 #{oid} を作成[/green]")


@order.command("list")
@click.argument("ep_number", type=int, required=False)
def list_cmd(ep_number):
    """発注書一覧"""
    proj = require_active_project()
    if ep_number:
        ep = episode_get(proj["id"], ep_number)
        if not ep:
            raise click.ClickException(f"第{ep_number}話が見つからない")
        orders = order_list(ep["id"])
    else:
        orders = order_list()
    if not orders:
        console.print("[dim]発注書なし[/dim]")
        return
    render_order_list(orders)


@order.command()
@click.argument("order_id", type=int)
@click.option("--output", default=None, help="出力先ファイルパス")
def export(order_id, output):
    """発注書をHTMLエクスポート"""
    o = order_get(order_id)
    if not o:
        raise click.ClickException(f"発注書 #{order_id} が見つからない")

    # Resolve assignee name
    if o["assignee_type"] == "creator":
        assignee = creator_get(o["assignee_id"])
    else:
        assignee = company_get(o["assignee_id"])
    assignee_name = assignee["name"] if assignee else "不明"

    try:
        from jinja2 import Environment, FileSystemLoader
        template_dir = Path(__file__).parent.parent.parent / "templates"
        env = Environment(loader=FileSystemLoader(str(template_dir)))
        tmpl = env.get_template("order.html")
        html = tmpl.render(order=o, assignee_name=assignee_name)
    except Exception:
        # Fallback: simple HTML
        cuts = o["cut_numbers"].split(",")
        html = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>発注書 #{o['id']}</title>
<style>body{{font-family:sans-serif;max-width:800px;margin:auto;padding:20px}}
table{{border-collapse:collapse;width:100%}}td,th{{border:1px solid #ccc;padding:8px}}</style></head>
<body><h1>発注書</h1>
<table><tr><th>発注書番号</th><td>{o['id']}</td></tr>
<tr><th>宛先</th><td>{assignee_name}</td></tr>
<tr><th>工程</th><td>{o['phase']}</td></tr>
<tr><th>カット</th><td>{', '.join(cuts)}</td></tr>
<tr><th>カット単価</th><td>¥{o['price_per_cut']:,}</td></tr>
<tr><th>合計金額</th><td>¥{o['total_price']:,}</td></tr>
<tr><th>納期</th><td>{o['deadline'] or '未定'}</td></tr></table></body></html>"""

    out_path = output or f"order_{order_id}.html"
    Path(out_path).write_text(html)
    order_issue(order_id)
    console.print(f"[green]発注書を出力: {out_path}[/green]")
