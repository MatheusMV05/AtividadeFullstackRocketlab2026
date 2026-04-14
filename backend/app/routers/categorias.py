from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.avaliacao_pedido import AvaliacaoPedido
from app.models.categoria_imagem import CategoriaImagem
from app.models.item_pedido import ItemPedido
from app.models.pedido import Pedido
from app.models.produto import Produto
from app.schemas.categoria import CategoriaDashboard, CategoriaCreate, CategoriaResponse, CategoriaStatsItem
from app.schemas.dashboard import ProdutoTopItem, ReceitaMensalItem

router = APIRouter(prefix="/categorias", tags=["Categorias"])


@router.get("/stats", response_model=list[CategoriaStatsItem])
def listar_categorias_stats(db: Session = Depends(get_db)):
    # Stats de produtos e vendas por categoria (exclui categorias vazias/nulas)
    produto_stats = (
        db.query(
            Produto.categoria_produto.label("categoria"),
            func.count(func.distinct(Produto.id_produto)).label("total_produtos"),
            func.coalesce(func.sum(ItemPedido.preco_BRL), 0).label("receita_total"),
            func.count(ItemPedido.id_pedido).label("total_vendas"),
        )
        .outerjoin(ItemPedido, ItemPedido.id_produto == Produto.id_produto)
        .filter(
            Produto.categoria_produto.isnot(None),
            func.trim(Produto.categoria_produto) != "",
        )
        .group_by(Produto.categoria_produto)
        .all()
    )

    # Média de avaliações por categoria (via pedido → avaliacao)
    avaliacao_stats = (
        db.query(
            Produto.categoria_produto.label("categoria"),
            func.avg(AvaliacaoPedido.avaliacao).label("media_avaliacao"),
        )
        .join(ItemPedido, ItemPedido.id_produto == Produto.id_produto)
        .join(Pedido, Pedido.id_pedido == ItemPedido.id_pedido)
        .join(AvaliacaoPedido, AvaliacaoPedido.id_pedido == Pedido.id_pedido)
        .filter(
            Produto.categoria_produto.isnot(None),
            func.trim(Produto.categoria_produto) != "",
        )
        .group_by(Produto.categoria_produto)
        .all()
    )
    media_por_categoria = {r.categoria: round(r.media_avaliacao, 2) for r in avaliacao_stats}

    # Imagens de todas as categorias registradas
    imagens = {img.categoria: img.link for img in db.query(CategoriaImagem).all()}

    # Categorias que existem em categoria_imagens mas ainda não têm produtos
    categorias_com_produto = {r.categoria for r in produto_stats}
    extras = [
        CategoriaStatsItem(
            categoria=cat,
            link_imagem=link,
            total_produtos=0,
            receita_total=0.0,
            media_avaliacao=None,
            total_vendas=0,
        )
        for cat, link in imagens.items()
        if cat not in categorias_com_produto
    ]

    resultado = [
        CategoriaStatsItem(
            categoria=r.categoria,
            link_imagem=imagens.get(r.categoria),
            total_produtos=r.total_produtos,
            receita_total=round(r.receita_total or 0, 2),
            media_avaliacao=media_por_categoria.get(r.categoria),
            total_vendas=r.total_vendas,
        )
        for r in produto_stats
    ]

    return resultado + extras


@router.get("/{categoria}/dashboard", response_model=CategoriaDashboard)
def get_categoria_dashboard(categoria: str, db: Session = Depends(get_db)):
    filtro = Produto.categoria_produto == categoria

    total_produtos = (
        db.query(func.count(func.distinct(Produto.id_produto)))
        .filter(filtro)
        .scalar() or 0
    )

    vendas_row = (
        db.query(
            func.count(ItemPedido.id_pedido),
            func.coalesce(func.sum(ItemPedido.preco_BRL), 0),
            func.avg(ItemPedido.preco_BRL),
        )
        .join(Produto, Produto.id_produto == ItemPedido.id_produto)
        .filter(filtro)
        .first()
    )
    total_vendas = vendas_row[0] or 0
    receita_total = round(vendas_row[1] or 0, 2)
    ticket_medio = round(vendas_row[2], 2) if vendas_row[2] else None

    avaliacao_row = (
        db.query(func.avg(AvaliacaoPedido.avaliacao))
        .join(Pedido, Pedido.id_pedido == AvaliacaoPedido.id_pedido)
        .join(ItemPedido, ItemPedido.id_pedido == Pedido.id_pedido)
        .join(Produto, Produto.id_produto == ItemPedido.id_produto)
        .filter(filtro)
        .scalar()
    )
    media_avaliacao = round(avaliacao_row, 2) if avaliacao_row else None

    top_produtos_rows = (
        db.query(
            Produto.id_produto,
            Produto.nome_produto,
            func.count(ItemPedido.id_pedido).label("total_vendas"),
            func.sum(ItemPedido.preco_BRL).label("receita"),
        )
        .join(ItemPedido, ItemPedido.id_produto == Produto.id_produto)
        .filter(filtro)
        .group_by(Produto.id_produto, Produto.nome_produto)
        .order_by(func.sum(ItemPedido.preco_BRL).desc())
        .limit(10)
        .all()
    )

    receita_por_mes_rows = (
        db.query(
            func.strftime("%Y-%m", Pedido.pedido_compra_timestamp).label("mes"),
            func.count(ItemPedido.id_pedido).label("pedidos"),
            func.sum(ItemPedido.preco_BRL).label("receita"),
        )
        .join(ItemPedido, ItemPedido.id_pedido == Pedido.id_pedido)
        .join(Produto, Produto.id_produto == ItemPedido.id_produto)
        .filter(filtro, Pedido.pedido_compra_timestamp.isnot(None))
        .group_by("mes")
        .order_by("mes")
        .all()
    )

    imagem = db.query(CategoriaImagem).filter(CategoriaImagem.categoria == categoria).first()

    return CategoriaDashboard(
        categoria=categoria,
        link_imagem=imagem.link if imagem else None,
        total_produtos=total_produtos,
        receita_total=receita_total,
        total_vendas=total_vendas,
        media_avaliacao=media_avaliacao,
        ticket_medio=ticket_medio,
        top_produtos=[
            ProdutoTopItem(
                id_produto=r.id_produto,
                nome_produto=r.nome_produto,
                total_vendas=r.total_vendas,
                receita=round(r.receita or 0, 2),
            )
            for r in top_produtos_rows
        ],
        receita_por_mes=[
            ReceitaMensalItem(
                mes=r.mes,
                pedidos=r.pedidos,
                receita=round(r.receita or 0, 2),
            )
            for r in receita_por_mes_rows
        ],
    )


@router.post("", response_model=CategoriaResponse, status_code=201)
def criar_categoria(data: CategoriaCreate, db: Session = Depends(get_db)):
    existente = db.query(CategoriaImagem).filter(
        CategoriaImagem.categoria == data.categoria
    ).first()
    if existente:
        raise HTTPException(status_code=409, detail="Categoria já existe")

    nova = CategoriaImagem(categoria=data.categoria, link=data.link_imagem)
    db.add(nova)
    db.commit()
    db.refresh(nova)
    return CategoriaResponse(categoria=nova.categoria, link_imagem=nova.link)
