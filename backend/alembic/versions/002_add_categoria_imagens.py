"""Adiciona tabela categoria_imagens

Revision ID: 002
Revises: 001
Create Date: 2026-04-13

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "categoria_imagens",
        sa.Column("categoria", sa.String(100), primary_key=True),
        sa.Column("link", sa.String(500), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("categoria_imagens")
