from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.avaliacao_pedido import AvaliacaoPedido
from app.models.item_pedido import ItemPedido
from app.models.pedido import Pedido
from app.models.produto import Produto
from app.schemas.alerta import AlertaItem

router = APIRouter(prefix="/alertas", tags=["Alertas"])


@router.get("", response_model=list[AlertaItem])
def listar_alertas(db: Session = Depends(get_db)):
    alertas: list[AlertaItem] = []
    now = datetime.utcnow()
    last_7 = now - timedelta(days=7)
    prior_7_start = now - timedelta(days=14)

    # Alerta 1: produtos com ≥3 avaliações de 1 estrela nos últimos 7 dias
    one_star_rows = (
        db.query(ItemPedido.id_produto, func.count(AvaliacaoPedido.id_avaliacao).label("cnt"))
        .join(Pedido, ItemPedido.id_pedido == Pedido.id_pedido)
        .join(AvaliacaoPedido, AvaliacaoPedido.id_pedido == Pedido.id_pedido)
        .filter(
            AvaliacaoPedido.avaliacao == 1,
            AvaliacaoPedido.data_comentario >= last_7,
        )
        .group_by(ItemPedido.id_produto)
        .having(func.count(AvaliacaoPedido.id_avaliacao) >= 3)
        .all()
    )

    if one_star_rows:
        ids_negativas = [r.id_produto for r in one_star_rows]
        produtos_neg = (
            db.query(Produto.id_produto, Produto.nome_produto)
            .filter(Produto.id_produto.in_(ids_negativas))
            .all()
        )
        nome_map = {p.id_produto: p.nome_produto for p in produtos_neg}
        for row in one_star_rows:
            alertas.append(AlertaItem(
                tipo="avaliacoes_negativas",
                id_produto=row.id_produto,
                nome_produto=nome_map.get(row.id_produto, row.id_produto),
                descricao=f"{row.cnt} avaliação(ões) de 1 estrela nos últimos 7 dias",
                severidade="alta",
            ))

    # Alerta 2: queda > 50% nas vendas (apenas produtos com > 5 vendas no total)
    def sales_in_window(start, end):
        return {
            r.id_produto: r.cnt
            for r in db.query(
                ItemPedido.id_produto,
                func.count(ItemPedido.id_pedido).label("cnt"),
            )
            .join(Pedido, ItemPedido.id_pedido == Pedido.id_pedido)
            .filter(
                Pedido.pedido_compra_timestamp >= start,
                Pedido.pedido_compra_timestamp < end,
            )
            .group_by(ItemPedido.id_produto)
            .all()
        }

    recent = sales_in_window(last_7, now)
    prior = sales_in_window(prior_7_start, last_7)

    eligible_ids = {
        r.id_produto
        for r in db.query(ItemPedido.id_produto, func.count(ItemPedido.id_pedido).label("total"))
        .group_by(ItemPedido.id_produto)
        .having(func.count(ItemPedido.id_pedido) > 5)
        .all()
    }

    drop_items = []
    for pid in eligible_ids:
        r = recent.get(pid, 0)
        p = prior.get(pid, 0)
        if p > 0 and r < p * 0.5:
            drop_items.append((pid, r, p))

    if drop_items:
        ids_drop = [d[0] for d in drop_items]
        produtos_drop = (
            db.query(Produto.id_produto, Produto.nome_produto)
            .filter(Produto.id_produto.in_(ids_drop))
            .all()
        )
        nome_map_drop = {p.id_produto: p.nome_produto for p in produtos_drop}
        for pid, r, p in drop_items:
            pct = round((1 - r / p) * 100)
            alertas.append(AlertaItem(
                tipo="queda_vendas",
                id_produto=pid,
                nome_produto=nome_map_drop.get(pid, pid),
                descricao=f"Queda de {pct}% nas vendas (últimos 7 dias vs. 7 dias anteriores)",
                severidade="alta" if pct >= 75 else "media",
            ))

    return alertas
