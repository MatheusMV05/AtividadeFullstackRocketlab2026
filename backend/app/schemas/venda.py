from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class VendaResponse(BaseModel):
    id_pedido: str
    id_item: int
    id_vendedor: str
    preco_BRL: float
    preco_frete: float
    status: str
    pedido_compra_timestamp: Optional[datetime] = None
    pedido_entregue_timestamp: Optional[datetime] = None
    entrega_no_prazo: Optional[str] = None

    model_config = {"from_attributes": True}


class VendaStats(BaseModel):
    total_vendas: int
    receita_total: float
    ticket_medio: Optional[float] = None
    frete_medio: Optional[float] = None
