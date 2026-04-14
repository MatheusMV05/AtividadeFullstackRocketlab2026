from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.produto import Produto
from app.models.item_pedido import ItemPedido
from app.models.pedido import Pedido
from app.models.avaliacao_pedido import AvaliacaoPedido
from app.schemas.avaliacao import AvaliacaoResponse, AvaliacaoStats, SentimentTag

router = APIRouter(prefix="/produtos/{id_produto}/avaliacoes", tags=["Avaliações"])

KEYWORD_GROUPS: list[tuple[str, list[str], str]] = [
    ("Ótima qualidade",       ["ótima qualidade", "excelente qualidade", "muito bom", "muito boa", "perfeito", "excelente produto"], "positive"),
    ("Produto conforme",      ["conforme descrito", "como descrito", "como esperado", "igual ao anuncio", "igual ao anúncio"], "positive"),
    ("Entrega rápida",        ["entrega rápida", "chegou rápido", "entregue antes", "prazo adiantado", "chegou antes"], "positive"),
    ("Bom custo-benefício",   ["custo beneficio", "custo-benefício", "vale a pena", "vale o preço", "bom preço"], "positive"),
    ("Bem embalado",          ["bem embalado", "embalagem ótima", "embalagem perfeita", "chegou bem embalado"], "positive"),
    ("Atendimento bom",       ["ótimo atendimento", "bom atendimento", "vendedor atencioso", "ótimo vendedor"], "positive"),
    ("Recomendo",             ["recomendo", "super recomendo", "indico", "recomendo muito"], "positive"),
    ("Quebrou rápido",        ["quebrou", "parou de funcionar", "estragou", "defeito", "danificado", "com defeito"], "negative"),
    ("Produto diferente",     ["diferente do anuncio", "diferente do anúncio", "não era o que esperava", "produto diferente", "não corresponde"], "negative"),
    ("Entrega atrasada",      ["entrega atrasada", "demorou muito", "chegou atrasado", "fora do prazo", "muito tempo"], "negative"),
    ("Qualidade ruim",        ["qualidade ruim", "muito fraco", "frágil", "não presta", "péssimo", "horrível"], "negative"),
    ("Embalagem danificada",  ["embalagem danificada", "caixa amassada", "chegou amassado", "chegou aberto", "embalagem rasgada"], "negative"),
    ("Tamanho incorreto",     ["tamanho errado", "tamanho incorreto", "não serve", "medida errada", "tamanho diferente"], "neutral"),
    ("Entrega normal",        ["entrega normal", "prazo normal", "dentro do prazo", "no prazo"], "neutral"),
    ("Produto original",      ["produto original", "é original", "original mesmo", "produto genuíno"], "positive"),
]


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
        .distinct(AvaliacaoPedido.id_avaliacao)
        .order_by(AvaliacaoPedido.id_avaliacao, AvaliacaoPedido.data_comentario.desc())
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


@router.get("/tags", response_model=list[SentimentTag])
def tags_avaliacoes(id_produto: str, db: Session = Depends(get_db)):
    _verificar_produto(id_produto, db)

    avaliacoes = (
        db.query(AvaliacaoPedido)
        .join(Pedido, AvaliacaoPedido.id_pedido == Pedido.id_pedido)
        .join(ItemPedido, ItemPedido.id_pedido == Pedido.id_pedido)
        .filter(ItemPedido.id_produto == id_produto)
        .all()
    )

    tag_counts: dict[str, int] = {}
    tag_sentiment: dict[str, str] = {}

    for av in avaliacoes:
        text = " ".join(filter(None, [
            (av.comentario or "").lower(),
            (av.titulo_comentario or "").lower(),
        ]))
        for tag_name, keywords, sentiment in KEYWORD_GROUPS:
            if any(kw in text for kw in keywords):
                tag_counts[tag_name] = tag_counts.get(tag_name, 0) + 1
                tag_sentiment[tag_name] = sentiment

    result = [
        SentimentTag(tag=k, count=v, sentiment=tag_sentiment[k])
        for k, v in tag_counts.items()
    ]
    result.sort(key=lambda x: x.count, reverse=True)
    return result
