from typing import Literal

from pydantic import BaseModel


class AlertaItem(BaseModel):
    tipo: Literal["avaliacoes_negativas", "queda_vendas"]
    id_produto: str
    nome_produto: str
    descricao: str
    severidade: Literal["alta", "media", "baixa"]
