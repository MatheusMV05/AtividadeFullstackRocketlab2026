from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.produto import Produto
from app.models.item_pedido import ItemPedido
from app.models.pedido import Pedido
from app.schemas.venda import VendaResponse, VendaStats

router = APIRouter(prefix="/produtos/{id_produto}/vendas", tags=["Vendas"])


def _verificar_produto(id_produto: str, db: Session) -> Produto:
    produto = db.query(Produto).filter(Produto.id_produto == id_produto).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return produto


@router.get("", response_model=list[VendaResponse])
def listar_vendas(id_produto: str, db: Session = Depends(get_db)):
    _verificar_produto(id_produto, db)

    itens = (
        db.query(ItemPedido, Pedido)
        .join(Pedido, ItemPedido.id_pedido == Pedido.id_pedido)
        .filter(ItemPedido.id_produto == id_produto)
        .order_by(Pedido.pedido_compra_timestamp.desc())
        .all()
    )

    resultado = []
    for item, pedido in itens:
        resultado.append(
            VendaResponse(
                id_pedido=item.id_pedido,
                id_item=item.id_item,
                id_vendedor=item.id_vendedor,
                preco_BRL=item.preco_BRL,
                preco_frete=item.preco_frete,
                status=pedido.status,
                pedido_compra_timestamp=pedido.pedido_compra_timestamp,
                pedido_entregue_timestamp=pedido.pedido_entregue_timestamp,
                entrega_no_prazo=pedido.entrega_no_prazo,
            )
        )

    return resultado


@router.get("/stats", response_model=VendaStats)
def stats_vendas(id_produto: str, db: Session = Depends(get_db)):
    _verificar_produto(id_produto, db)

    row = (
        db.query(
            func.count(ItemPedido.id_pedido),
            func.sum(ItemPedido.preco_BRL),
            func.avg(ItemPedido.preco_BRL),
            func.avg(ItemPedido.preco_frete),
        )
        .filter(ItemPedido.id_produto == id_produto)
        .first()
    )

    total_vendas, receita_total, ticket_medio, frete_medio = row

    return VendaStats(
        total_vendas=total_vendas or 0,
        receita_total=round(receita_total or 0, 2),
        ticket_medio=round(ticket_medio, 2) if ticket_medio else None,
        frete_medio=round(frete_medio, 2) if frete_medio else None,
    )
