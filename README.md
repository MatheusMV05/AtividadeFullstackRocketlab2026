# Sistema de Gerenciamento de E-Commerce

Aplicação fullstack para gerenciamento de produtos, vendas e avaliações de um e-commerce.

## Stack

- **Frontend:** Vite + React + TypeScript + shadcn/ui (Tailwind CSS)
- **Backend:** FastAPI (Python)
- **Banco de dados:** SQLite (via SQLAlchemy + Alembic)

---

## Pré-requisitos

- Python 3.11+
- Node.js 18+
- npm 9+

---

## Como executar

### 1. Backend

```bash
cd backend

# Criar e ativar ambiente virtual
python -m venv .venv

# Windows
.venv\Scripts\activate

# Linux/macOS
source .venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o .env se necessário (padrão: sqlite:///./database.db)

# Rodar as migrações (cria o banco)
alembic upgrade head

# Iniciar o servidor
uvicorn app.main:app --reload
```

A API estará disponível em `http://localhost:8000`.  
Documentação interativa: `http://localhost:8000/docs`

---

### 2. Popular o banco de dados (seed)

Os arquivos `.csv` devem estar em `backend/DatabaseCsvs/`. O script roda as migrações automaticamente e popula todas as tabelas:

```bash
cd backend
python seed.py
```

O seed insere:
- 32.951 produtos
- 99.441 consumidores
- 3.095 vendedores
- 99.441 pedidos
- 112.650 itens de pedido
- 94.540 avaliações (duplicatas ignoradas)
- 69 imagens de categoria

---

### 3. Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# VITE_API_URL=http://localhost:8000

# Iniciar o servidor de desenvolvimento
npm run dev
```

O frontend estará disponível em `http://localhost:5173`.

---

## Funcionalidades

| Funcionalidade | Descrição |
|---|---|
| Catálogo de produtos | Listagem paginada com busca por nome/categoria e filtro por categoria |
| Detalhes do produto | Medidas, stats de vendas, média de avaliações e distribuição por estrelas |
| Avaliações | Lista de avaliações dos consumidores com data |
| Histórico de vendas | Tabela de vendas com status, preço e entrega |
| Adicionar produto | Formulário com validação para criar novo produto |
| Editar produto | Edição inline dos dados do produto |
| Remover produto | Exclusão com confirmação via dialog |

---

## Endpoints da API

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/produtos` | Lista produtos (paginação, busca, filtro) |
| `GET` | `/produtos/categorias` | Lista categorias disponíveis |
| `GET` | `/produtos/{id}` | Detalhes de um produto |
| `POST` | `/produtos` | Cria um produto |
| `PATCH` | `/produtos/{id}` | Atualiza um produto |
| `DELETE` | `/produtos/{id}` | Remove um produto |
| `GET` | `/produtos/{id}/avaliacoes` | Lista avaliações do produto |
| `GET` | `/produtos/{id}/avaliacoes/stats` | Estatísticas de avaliações |
| `GET` | `/produtos/{id}/vendas` | Lista vendas do produto |
| `GET` | `/produtos/{id}/vendas/stats` | Estatísticas de vendas |

---

## Estrutura do projeto

```
.
├── backend/
│   ├── app/
│   │   ├── models/          # Modelos SQLAlchemy
│   │   ├── routers/         # Routers FastAPI (produtos, avaliacoes, vendas)
│   │   ├── schemas/         # Schemas Pydantic
│   │   ├── config.py        # Configuração (DATABASE_URL)
│   │   ├── database.py      # Engine + sessão
│   │   └── main.py          # App FastAPI + CORS
│   ├── alembic/             # Migrações do banco
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── components/ui/   # Componentes shadcn/ui
    │   ├── hooks/           # useToast
    │   ├── lib/             # api.ts, utils.ts
    │   ├── pages/           # CatalogPage, ProductDetailPage, ProductFormPage
    │   ├── types/           # Tipagens TypeScript
    │   ├── App.tsx
    │   └── main.tsx
    ├── package.json
    └── .env.example
```
