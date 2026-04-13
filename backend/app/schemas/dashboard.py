from pydantic import BaseModel


class ReceitaMensalItem(BaseModel):
    mes: str
    receita: float
    pedidos: int


class StatusItem(BaseModel):
    status: str
    total: int


class CategoriaStatItem(BaseModel):
    categoria: str
    receita: float
    total_vendas: int


class ProdutoTopItem(BaseModel):
    id_produto: str
    nome_produto: str
    total_vendas: int
    receita: float


class DashboardStats(BaseModel):
    total_produtos: int
    total_pedidos: int
    total_consumidores: int
    receita_total: float
    ticket_medio: float | None
    receita_por_mes: list[ReceitaMensalItem]
    pedidos_por_status: list[StatusItem]
    top_categorias: list[CategoriaStatItem]
    top_produtos: list[ProdutoTopItem]
