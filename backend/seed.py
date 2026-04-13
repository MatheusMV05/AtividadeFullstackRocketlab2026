"""
Script de seed: popula o banco de dados a partir dos CSVs em DatabaseCsvs/.
Executa as migrações automaticamente antes de inserir os dados.

Uso:
    python seed.py
"""

import csv
import os
import subprocess
import sys
from datetime import datetime, date
from pathlib import Path

# Garante que o diretório do script é o CWD
os.chdir(Path(__file__).parent)

# ── Roda as migrações ────────────────────────────────────────────────────────
print(">> Rodando migracoes (alembic upgrade head)...")
result = subprocess.run(
    [sys.executable, "-m", "alembic", "upgrade", "head"],
    capture_output=True,
    text=True,
)
if result.returncode != 0:
    print("ERRO nas migrações:")
    print(result.stdout)
    print(result.stderr)
    sys.exit(1)
print("  OK - Migracoes aplicadas")
print()

# ── Configura SQLAlchemy ─────────────────────────────────────────────────────
from app.database import SessionLocal  # noqa: E402 (importado após chdir)
from app.models import (  # noqa: E402
    Consumidor,
    Produto,
    Vendedor,
    Pedido,
    ItemPedido,
    AvaliacaoPedido,
)
from app.models.categoria_imagem import CategoriaImagem  # noqa: E402

CSV_DIR = Path("DatabaseCsvs")
BATCH = 5_000  # linhas por commit


def parse_float(value: str) -> float | None:
    v = value.strip()
    if not v:
        return None
    try:
        return float(v)
    except ValueError:
        return None


def parse_int(value: str) -> int | None:
    v = value.strip()
    if not v:
        return None
    try:
        return int(float(v))
    except ValueError:
        return None


def parse_datetime(value: str) -> datetime | None:
    v = value.strip()
    if not v:
        return None
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S"):
        try:
            return datetime.strptime(v, fmt)
        except ValueError:
            pass
    return None


def parse_date(value: str) -> date | None:
    v = value.strip()
    if not v:
        return None
    try:
        return datetime.strptime(v, "%Y-%m-%d").date()
    except ValueError:
        return None


def seed_table(name: str, path: Path, build_row, model_class, pk_attr: str | None = None):
    print(f">> Populando {name}...")
    if not path.exists():
        print(f"  AVISO - Arquivo nao encontrado: {path}")
        return

    db = SessionLocal()
    try:
        # Limpa a tabela antes de inserir
        db.query(model_class).delete()
        db.commit()

        count = 0
        skipped = 0
        batch = []
        seen_pks: set = set()

        with open(path, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                obj = build_row(row)
                if obj is None:
                    continue

                # Deduplicacao por chave primaria simples (quando informado)
                if pk_attr:
                    pk_val = getattr(obj, pk_attr)
                    if pk_val in seen_pks:
                        skipped += 1
                        continue
                    seen_pks.add(pk_val)

                batch.append(obj)
                count += 1
                if len(batch) >= BATCH:
                    db.bulk_save_objects(batch)
                    db.commit()
                    batch = []

        if batch:
            db.bulk_save_objects(batch)
            db.commit()

        msg = f"  OK - {count} registros inseridos"
        if skipped:
            msg += f" ({skipped} duplicatas ignoradas)"
        print(msg)
    except Exception as exc:
        db.rollback()
        print(f"  ERRO: {exc}")
        raise
    finally:
        db.close()


# ── Consumidores ─────────────────────────────────────────────────────────────
def build_consumidor(row: dict):
    return Consumidor(
        id_consumidor=row["id_consumidor"].strip(),
        prefixo_cep=row["prefixo_cep"].strip(),
        nome_consumidor=row["nome_consumidor"].strip(),
        cidade=row["cidade"].strip(),
        estado=row["estado"].strip(),
    )


seed_table(
    "consumidores",
    CSV_DIR / "dim_consumidores.csv",
    build_consumidor,
    Consumidor,
    pk_attr="id_consumidor",
)

# ── Produtos ─────────────────────────────────────────────────────────────────
def build_produto(row: dict):
    return Produto(
        id_produto=row["id_produto"].strip(),
        nome_produto=row["nome_produto"].strip(),
        categoria_produto=row["categoria_produto"].strip(),
        peso_produto_gramas=parse_float(row.get("peso_produto_gramas", "")),
        comprimento_centimetros=parse_float(row.get("comprimento_centimetros", "")),
        altura_centimetros=parse_float(row.get("altura_centimetros", "")),
        largura_centimetros=parse_float(row.get("largura_centimetros", "")),
    )


seed_table(
    "produtos",
    CSV_DIR / "dim_produtos.csv",
    build_produto,
    Produto,
    pk_attr="id_produto",
)

# ── Vendedores ────────────────────────────────────────────────────────────────
def build_vendedor(row: dict):
    return Vendedor(
        id_vendedor=row["id_vendedor"].strip(),
        nome_vendedor=row["nome_vendedor"].strip(),
        prefixo_cep=row["prefixo_cep"].strip(),
        cidade=row["cidade"].strip(),
        estado=row["estado"].strip(),
    )


seed_table(
    "vendedores",
    CSV_DIR / "dim_vendedores.csv",
    build_vendedor,
    Vendedor,
    pk_attr="id_vendedor",
)

# ── Pedidos ───────────────────────────────────────────────────────────────────
def build_pedido(row: dict):
    return Pedido(
        id_pedido=row["id_pedido"].strip(),
        id_consumidor=row["id_consumidor"].strip(),
        status=row["status"].strip(),
        pedido_compra_timestamp=parse_datetime(row.get("pedido_compra_timestamp", "")),
        pedido_entregue_timestamp=parse_datetime(
            row.get("pedido_entregue_timestamp", "")
        ),
        data_estimada_entrega=parse_date(row.get("data_estimada_entrega", "")),
        tempo_entrega_dias=parse_float(row.get("tempo_entrega_dias", "")),
        tempo_entrega_estimado_dias=parse_float(
            row.get("tempo_entrega_estimado_dias", "")
        ),
        diferenca_entrega_dias=parse_float(row.get("diferenca_entrega_dias", "")),
        entrega_no_prazo=row.get("entrega_no_prazo", "").strip() or None,
    )


seed_table(
    "pedidos",
    CSV_DIR / "fat_pedidos.csv",
    build_pedido,
    Pedido,
    pk_attr="id_pedido",
)

# ── Itens de Pedido ───────────────────────────────────────────────────────────
def build_item_pedido(row: dict):
    return ItemPedido(
        id_pedido=row["id_pedido"].strip(),
        id_item=int(row["id_item"].strip()),
        id_produto=row["id_produto"].strip(),
        id_vendedor=row["id_vendedor"].strip(),
        preco_BRL=float(row["preco_BRL"].strip()),
        preco_frete=float(row["preco_frete"].strip()),
    )


seed_table(
    "itens_pedidos",
    CSV_DIR / "fat_itens_pedidos.csv",
    build_item_pedido,
    ItemPedido,
)

# ── Avaliações ────────────────────────────────────────────────────────────────
def build_avaliacao(row: dict):
    return AvaliacaoPedido(
        id_avaliacao=row["id_avaliacao"].strip(),
        id_pedido=row["id_pedido"].strip(),
        avaliacao=int(row["avaliacao"].strip()),
        titulo_comentario=row.get("titulo_comentario", "").strip() or None,
        comentario=row.get("comentario", "").strip() or None,
        data_comentario=parse_datetime(row.get("data_comentario", "")),
        data_resposta=parse_datetime(row.get("data_resposta", "")),
    )


seed_table(
    "avaliacoes_pedidos",
    CSV_DIR / "fat_avaliacoes_pedidos.csv",
    build_avaliacao,
    AvaliacaoPedido,
    pk_attr="id_avaliacao",
)

# ── Categoria Imagens ─────────────────────────────────────────────────────────
def build_categoria_imagem(row: dict):
    categoria = row.get("Categoria", "").strip()
    link = row.get("Link", "").strip()
    if not categoria or not link:
        return None
    return CategoriaImagem(categoria=categoria, link=link)


seed_table(
    "categoria_imagens",
    CSV_DIR / "dim_categoria_imagens.csv",
    build_categoria_imagem,
    CategoriaImagem,
)

print()
print("Seed concluido com sucesso!")
