# Sistema de Gerenciamento de E-Commerce

Aplicação fullstack para gerenciamento de produtos, vendas e avaliações de um e-commerce.

## Stack

- **Frontend:** Vite + React + TypeScript + shadcn/ui (Tailwind CSS v4)
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
| `GET` | `/produtos/{id}/avaliacoes/tags` | Tags de sentimento extraídas dos textos de avaliação ⭐ |
| `GET` | `/produtos/{id}/vendas/timeline` | Série temporal de vendas por dia (query param `days`) ⭐ |
| `GET` | `/produtos/{id}/health-score` | Score de saúde do produto (0–100) ⭐ |
| `GET` | `/alertas` | Lista de alertas ativos (queda de vendas, avaliações negativas) ⭐ |

---

## Extras implementados

Funcionalidades adicionadas além dos requisitos originais da atividade.

### Backend

| Recurso | Detalhes |
|---|---|
| **Health Score** (`GET /produtos/{id}/health-score`) | Pontuação de 0 a 100 calculada a partir de três componentes: média de avaliações (até 50 pts), volume de vendas nos últimos 30 dias (até 30 pts) e taxa de não-cancelamento (até 20 pts) |
| **Tags de sentimento** (`GET /produtos/{id}/avaliacoes/tags`) | Extração de palavras-chave dos textos de avaliação agrupadas em ~15 categorias (ex.: "Entrega rápida", "Quebrou rápido") com classificação positivo/negativo/neutro |
| **Timeline de vendas** (`GET /produtos/{id}/vendas/timeline?days=N`) | Série temporal diária de quantidade e receita para os últimos N dias (7 a 365), usando `func.date()` do SQLite |
| **Alertas automáticos** (`GET /alertas`) | Dois tipos de alerta: produtos com ≥ 3 avaliações de 1 estrela nos últimos 7 dias, e produtos com queda de vendas > 50% em relação à semana anterior |

### Frontend

| Recurso | Detalhes |
|---|---|
| **Tema Tailwind CSS v4** | Migração completa de Tailwind v3 para v4 com tema tweakcn (cores oklch, plugin `@tailwindcss/vite`, fontes Outfit/Merriweather/JetBrains Mono) |
| **Dark mode** | Toggle na navbar com persistência via `localStorage`; sem flash na inicialização |
| **Health Score Ring** | Anel SVG animado no cabeçalho da página de detalhes com cor semântica (verde ≥ 80, amarelo ≥ 50, vermelho < 50) |
| **Feed de alertas** | Painel colapsável no topo do catálogo exibindo alertas ativos com ícone, severidade e link direto para o produto |
| **Tags de sentimento** | Pílulas coloridas na página de detalhes (verde = positivo, vermelho = negativo, cinza = neutro) geradas a partir das avaliações |
| **Simulador de preço** | Slider no formulário de edição que projeta quantas unidades/mês são necessárias para manter a receita atual caso o preço médio mude |
| **Gráfico de timeline** | Aba "Desempenho" na página de detalhes com `AreaChart` (recharts) para visualizar receita ao longo do tempo; botões para alternar entre 7, 30, 90 e 365 dias |
| **Visualização em tabela** | Toggle grade/tabela no catálogo usando `@tanstack/react-table`; a coluna de categoria suporta edição inline diretamente na célula (clique → `<select>` → Enter/blur salva, Escape cancela) |
| **Cores por categoria** | Badges coloridos para cada grupo de categoria (eletrônicos = azul, games = violeta, moda = rosa, casa = âmbar, etc.) |
| **Formatação de nomes e categorias** | `formatNomeProduto` remove artefatos de escape CSV; `formatCategoria` converte slugs snake_case para rótulos legíveis em português |
| **Animações de layout** | Cards do catálogo animam com `framer-motion` (`layout` prop) ao filtrar; entrada das seções da página de detalhes é escalonada (`staggerChildren: 0.08s`) |
| **Transição compartilhada** | O título do produto usa `layoutId` do Framer Motion para uma transição suave do card do catálogo até o cabeçalho da página de detalhes |
| **Botão de salvar animado** | Três estados com `AnimatePresence`: ícone de salvar → spinner giratório → ícone de check (verde), seguido de redirecionamento automático |
| **Empty states acionáveis** | Telas vazias de avaliações e vendas incluem botões de ação contextuais (ex.: "Editar Produto", "Ver Catálogo") |
| **Numerais tabulares** | Classe `tabular-nums` em todos os valores numéricos (KPIs, tabelas de vendas) para alinhamento visual consistente |

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
