from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.produto import Produto
from app.models.item_pedido import ItemPedido
from app.models.pedido import Pedido
from app.models.avaliacao_pedido import AvaliacaoPedido
from app.schemas.avaliacao import AvaliacaoResponse, AvaliacaoStats

router = APIRouter(prefix="/produtos/{id_produto}/avaliacoes", tags=["Avaliações"])


def _verificar_produto(id_produto: str, db: Session) -> Produto:
    produto = db.query(Produto).filter(Produto.id_produto == id_produto).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return produto


@router.get("", response_model=list[AvaliacaoResponse])
def listar_avaliacoes(id_produto: str, db: Session = Depends(get_db)):
    _verificar_produto(id_produto, db)

    avaliacoes = (
        db.query(AvaliacaoPedido)
        .join(Pedido, AvaliacaoPedido.id_pedido == Pedido.id_pedido)
        .join(ItemPedido, ItemPedido.id_pedido == Pedido.id_pedido)
        .filter(ItemPedido.id_produto == id_produto)
        .order_by(AvaliacaoPedido.data_comentario.desc())
        .all()
    )

    return avaliacoes


@router.get("/stats", response_model=AvaliacaoStats)
def stats_avaliacoes(id_produto: str, db: Session = Depends(get_db)):
    _verificar_produto(id_produto, db)

    rows = (
        db.query(AvaliacaoPedido.avaliacao, func.count(AvaliacaoPedido.avaliacao))
        .join(Pedido, AvaliacaoPedido.id_pedido == Pedido.id_pedido)
        .join(ItemPedido, ItemPedido.id_pedido == Pedido.id_pedido)
        .filter(ItemPedido.id_produto == id_produto)
        .group_by(AvaliacaoPedido.avaliacao)
        .all()
    )

    distribuicao = {str(i): 0 for i in range(1, 6)}
    total = 0
    soma = 0

    for nota, contagem in rows:
        distribuicao[str(nota)] = contagem
        total += contagem
        soma += nota * contagem

    media = round(soma / total, 2) if total > 0 else None

    return AvaliacaoStats(
        media_avaliacao=media,
        total_avaliacoes=total,
        distribuicao=distribuicao,
    )
