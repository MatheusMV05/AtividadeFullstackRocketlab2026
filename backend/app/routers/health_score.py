from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.avaliacao_pedido import AvaliacaoPedido
from app.models.item_pedido import ItemPedido
from app.models.pedido import Pedido
from app.models.produto import Produto
from app.schemas.health_score import HealthScoreResponse

router = APIRouter(prefix="/produtos/{id_produto}", tags=["Health Score"])


@router.get("/health-score", response_model=HealthScoreResponse)
def get_health_score(id_produto: str, db: Session = Depends(get_db)):
    produto = db.query(Produto).filter(Produto.id_produto == id_produto).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    # rating_component: média das avaliações vinculadas ao produto
    avg_row = (
        db.query(func.avg(AvaliacaoPedido.avaliacao))
        .join(Pedido, AvaliacaoPedido.id_pedido == Pedido.id_pedido)
        .join(ItemPedido, ItemPedido.id_pedido == Pedido.id_pedido)
        .filter(ItemPedido.id_produto == id_produto)
        .scalar()
    )
    avg_rating = float(avg_row) if avg_row is not None else None
    rating_component = (avg_rating * 10) if avg_rating is not None else 25.0

    # sales_30d_component: vendas dos últimos 30 dias
    cutoff = datetime.utcnow() - timedelta(days=30)
    sales_30d = (
        db.query(func.count(ItemPedido.id_pedido))
        .join(Pedido, ItemPedido.id_pedido == Pedido.id_pedido)
        .filter(
            ItemPedido.id_produto == id_produto,
            Pedido.pedido_compra_timestamp >= cutoff,
        )
        .scalar()
    ) or 0
    sales_30d_component = min(float(sales_30d) * 2, 30.0)

    # quality_component: penalidade por taxa de cancelamento
    total_orders = (
        db.query(func.count(ItemPedido.id_pedido))
        .filter(ItemPedido.id_produto == id_produto)
        .scalar()
    ) or 0
    cancelled_orders = (
        db.query(func.count(ItemPedido.id_pedido))
        .join(Pedido, ItemPedido.id_pedido == Pedido.id_pedido)
        .filter(
            ItemPedido.id_produto == id_produto,
            Pedido.status == "cancelado",
        )
        .scalar()
    ) or 0
    cancellation_rate = (cancelled_orders / total_orders) if total_orders > 0 else 0.0
    quality_component = (1 - cancellation_rate) * 20.0

    score = round(rating_component + sales_30d_component + quality_component, 1)

    return HealthScoreResponse(
        score=score,
        rating_component=round(rating_component, 1),
        sales_30d_component=round(sales_30d_component, 1),
        quality_component=round(quality_component, 1),
    )
