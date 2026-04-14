import uuid
import math
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.produto import Produto
from app.models.categoria_imagem import CategoriaImagem
from app.schemas.produto import (
    ProdutoCreate,
    ProdutoUpdate,
    ProdutoResponse,
    ProdutoListResponse,
)

router = APIRouter(prefix="/produtos", tags=["Produtos"])


@router.get("", response_model=ProdutoListResponse)
def listar_produtos(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    busca: Optional[str] = Query(None, description="Busca por nome ou categoria"),
    categoria: Optional[str] = Query(None, description="Filtrar por categoria"),
    db: Session = Depends(get_db),
):
    query = db.query(Produto)

    if busca:
        termo = f"%{busca}%"
        query = query.filter(
            Produto.nome_produto.ilike(termo) | Produto.categoria_produto.ilike(termo)
        )

    if categoria:
        query = query.filter(Produto.categoria_produto.ilike(f"%{categoria}%"))

    total = query.count()
    total_pages = max(1, math.ceil(total / page_size))
    offset = (page - 1) * page_size

    items = query.order_by(Produto.nome_produto).offset(offset).limit(page_size).all()

    return ProdutoListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/categorias", response_model=list[str], tags=["Produtos"])
def listar_categorias(db: Session = Depends(get_db)):
    de_produtos = {
        r[0]
        for r in db.query(Produto.categoria_produto).distinct().all()
        if r[0] and r[0].strip()
    }
    de_imagens = {
        r[0]
        for r in db.query(CategoriaImagem.categoria).all()
        if r[0] and r[0].strip()
    }
    return sorted(de_produtos | de_imagens)


@router.get("/categoria-imagem/{categoria}", tags=["Produtos"])
def obter_imagem_categoria(categoria: str, db: Session = Depends(get_db)):
    img = db.query(CategoriaImagem).filter(
        CategoriaImagem.categoria == categoria
    ).first()
    if not img:
        raise HTTPException(status_code=404, detail="Imagem não encontrada")
    return {"categoria": img.categoria, "link": img.link}


@router.get("/{id_produto}", response_model=ProdutoResponse)
def obter_produto(id_produto: str, db: Session = Depends(get_db)):
    produto = db.query(Produto).filter(Produto.id_produto == id_produto).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return produto


@router.post("", response_model=ProdutoResponse, status_code=201)
def criar_produto(data: ProdutoCreate, db: Session = Depends(get_db)):
    produto = Produto(
        id_produto=uuid.uuid4().hex,
        **data.model_dump(),
    )
    db.add(produto)
    db.commit()
    db.refresh(produto)
    return produto


@router.patch("/{id_produto}", response_model=ProdutoResponse)
def atualizar_produto(
    id_produto: str, data: ProdutoUpdate, db: Session = Depends(get_db)
):
    produto = db.query(Produto).filter(Produto.id_produto == id_produto).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    for campo, valor in data.model_dump(exclude_unset=True).items():
        setattr(produto, campo, valor)

    db.commit()
    db.refresh(produto)
    return produto


@router.delete("/{id_produto}", status_code=204)
def remover_produto(id_produto: str, db: Session = Depends(get_db)):
    produto = db.query(Produto).filter(Produto.id_produto == id_produto).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    db.delete(produto)
    db.commit()
