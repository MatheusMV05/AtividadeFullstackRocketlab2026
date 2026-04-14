from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.consumidor import Consumidor
from app.models.item_pedido import ItemPedido
from app.models.pedido import Pedido
from app.models.produto import Produto
from app.schemas.dashboard import (
    CategoriaStatItem,
    DashboardMesStats,
    DashboardStats,
    ProdutoTopItem,
    ReceitaDiariaItem,
    ReceitaMensalItem,
    StatusItem,
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/receita-diaria", response_model=list[ReceitaDiariaItem])
def get_receita_diaria(
    ano: int = Query(..., ge=2000, le=2100),
    mes: int = Query(..., ge=1, le=12),
    db: Session = Depends(get_db),
):
    mes_str = f"{mes:02d}"
    ano_str = str(ano)

    rows = (
        db.query(
            func.strftime("%Y-%m-%d", Pedido.pedido_compra_timestamp).label("dia"),
            func.count(ItemPedido.id_pedido).label("pedidos"),
            func.sum(ItemPedido.preco_BRL).label("receita"),
        )
        .join(Pedido, ItemPedido.id_pedido == Pedido.id_pedido)
        .filter(
            Pedido.pedido_compra_timestamp.isnot(None),
            func.strftime("%Y", Pedido.pedido_compra_timestamp) == ano_str,
            func.strftime("%m", Pedido.pedido_compra_timestamp) == mes_str,
        )
        .group_by("dia")
        .order_by("dia")
        .all()
    )

    return [
        ReceitaDiariaItem(
            dia=r.dia,
            pedidos=r.pedidos,
            receita=round(r.receita or 0, 2),
        )
        for r in rows
    ]


@router.get("/stats-mes", response_model=DashboardMesStats)
def get_stats_mes(
    ano: int = Query(..., ge=2000, le=2100),
    mes: int = Query(..., ge=1, le=12),
    db: Session = Depends(get_db),
):
    mes_str = f"{mes:02d}"
    ano_str = str(ano)
    filtro_mes = [
        Pedido.pedido_compra_timestamp.isnot(None),
        func.strftime("%Y", Pedido.pedido_compra_timestamp) == ano_str,
        func.strftime("%m", Pedido.pedido_compra_timestamp) == mes_str,
    ]

    pedidos_por_status_rows = (
        db.query(Pedido.status, func.count(Pedido.id_pedido).label("total"))
        .filter(*filtro_mes)
        .group_by(Pedido.status)
        .order_by(func.count(Pedido.id_pedido).desc())
        .all()
    )

    top_categorias_rows = (
        db.query(
            Produto.categoria_produto,
            func.sum(ItemPedido.preco_BRL).label("receita"),
            func.count(ItemPedido.id_pedido).label("total_vendas"),
        )
        .join(ItemPedido, ItemPedido.id_produto == Produto.id_produto)
        .join(Pedido, Pedido.id_pedido == ItemPedido.id_pedido)
        .filter(
            Produto.categoria_produto.isnot(None),
            func.trim(Produto.categoria_produto) != "",
            *filtro_mes,
        )
        .group_by(Produto.categoria_produto)
        .order_by(func.sum(ItemPedido.preco_BRL).desc())
        .limit(10)
        .all()
    )

    return DashboardMesStats(
        pedidos_por_status=[
            StatusItem(status=r.status, total=r.total)
            for r in pedidos_por_status_rows
        ],
        top_categorias=[
            CategoriaStatItem(
                categoria=r.categoria_produto,
                receita=round(r.receita or 0, 2),
                total_vendas=r.total_vendas,
            )
            for r in top_categorias_rows
        ],
    )


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_produtos = db.query(func.count(Produto.id_produto)).scalar() or 0
    total_pedidos = db.query(func.count(Pedido.id_pedido)).scalar() or 0
    total_consumidores = db.query(func.count(Consumidor.id_consumidor)).scalar() or 0

    receita_row = db.query(
        func.sum(ItemPedido.preco_BRL),
        func.avg(ItemPedido.preco_BRL),
    ).first()
    receita_total = round(receita_row[0] or 0, 2)
    ticket_medio = round(receita_row[1], 2) if receita_row[1] else None

    receita_por_mes_rows = (
        db.query(
            func.strftime("%Y-%m", Pedido.pedido_compra_timestamp).label("mes"),
            func.count(ItemPedido.id_pedido).label("pedidos"),
            func.sum(ItemPedido.preco_BRL).label("receita"),
        )
        .join(Pedido, ItemPedido.id_pedido == Pedido.id_pedido)
        .filter(Pedido.pedido_compra_timestamp.isnot(None))
        .group_by("mes")
        .order_by("mes")
        .all()
    )

    pedidos_por_status_rows = (
        db.query(
            Pedido.status,
            func.count(Pedido.id_pedido).label("total"),
        )
        .group_by(Pedido.status)
        .order_by(func.count(Pedido.id_pedido).desc())
        .all()
    )

    top_categorias_rows = (
        db.query(
            Produto.categoria_produto,
            func.sum(ItemPedido.preco_BRL).label("receita"),
            func.count(ItemPedido.id_pedido).label("total_vendas"),
        )
        .join(ItemPedido, ItemPedido.id_produto == Produto.id_produto)
        .group_by(Produto.categoria_produto)
        .order_by(func.sum(ItemPedido.preco_BRL).desc())
        .limit(10)
        .all()
    )

    top_produtos_rows = (
        db.query(
            Produto.id_produto,
            Produto.nome_produto,
            func.count(ItemPedido.id_pedido).label("total_vendas"),
            func.sum(ItemPedido.preco_BRL).label("receita"),
        )
        .join(ItemPedido, ItemPedido.id_produto == Produto.id_produto)
        .group_by(Produto.id_produto, Produto.nome_produto)
        .order_by(func.sum(ItemPedido.preco_BRL).desc())
        .limit(10)
        .all()
    )

    return DashboardStats(
        total_produtos=total_produtos,
        total_pedidos=total_pedidos,
        total_consumidores=total_consumidores,
        receita_total=receita_total,
        ticket_medio=ticket_medio,
        receita_por_mes=[
            ReceitaMensalItem(
                mes=r.mes,
                pedidos=r.pedidos,
                receita=round(r.receita or 0, 2),
            )
            for r in receita_por_mes_rows
        ],
        pedidos_por_status=[
            StatusItem(status=r.status, total=r.total)
            for r in pedidos_por_status_rows
        ],
        top_categorias=[
            CategoriaStatItem(
                categoria=r.categoria_produto,
                receita=round(r.receita or 0, 2),
                total_vendas=r.total_vendas,
            )
            for r in top_categorias_rows
        ],
        top_produtos=[
            ProdutoTopItem(
                id_produto=r.id_produto,
                nome_produto=r.nome_produto,
                total_vendas=r.total_vendas,
                receita=round(r.receita or 0, 2),
            )
            for r in top_produtos_rows
        ],
    )
