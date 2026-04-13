from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class AvaliacaoResponse(BaseModel):
    id_avaliacao: str
    id_pedido: str
    avaliacao: int
    titulo_comentario: Optional[str] = None
    comentario: Optional[str] = None
    data_comentario: Optional[datetime] = None
    data_resposta: Optional[datetime] = None

    model_config = {"from_attributes": True}


class AvaliacaoStats(BaseModel):
    media_avaliacao: Optional[float] = None
    total_avaliacoes: int
    distribuicao: dict[str, int]
