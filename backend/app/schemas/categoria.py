from typing import Optional
from pydantic import BaseModel, Field

from app.schemas.dashboard import ProdutoTopItem, ReceitaMensalItem


class CategoriaStatsItem(BaseModel):
    categoria: str
    link_imagem: Optional[str]
    total_produtos: int
    receita_total: float
    media_avaliacao: Optional[float]
    total_vendas: int


class CategoriaDashboard(BaseModel):
    categoria: str
    link_imagem: Optional[str]
    total_produtos: int
    receita_total: float
    total_vendas: int
    media_avaliacao: Optional[float]
    ticket_medio: Optional[float]
    top_produtos: list[ProdutoTopItem]
    receita_por_mes: list[ReceitaMensalItem]


class CategoriaCreate(BaseModel):
    categoria: str = Field(..., min_length=1, max_length=100)
    link_imagem: str = Field(..., min_length=1)


class CategoriaResponse(BaseModel):
    categoria: str
    link_imagem: str

    model_config = {"from_attributes": True}
