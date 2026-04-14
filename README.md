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
| `GET` | `/produtos/categorias` | Lista todas as categorias (produtos + categoria_imagens) |
| `GET` | `/produtos/{id}` | Detalhes de um produto |
| `POST` | `/produtos` | Cria um produto |
| `PATCH` | `/produtos/{id}` | Atualiza um produto |
| `DELETE` | `/produtos/{id}` | Remove um produto |
| `GET` | `/produtos/{id}/avaliacoes` | Lista avaliações do produto |
| `GET` | `/produtos/{id}/avaliacoes/stats` | Estatísticas de avaliações |
| `GET` | `/produtos/{id}/vendas` | Lista vendas do produto |
| `GET` | `/produtos/{id}/vendas/stats` | Estatísticas de vendas |
| `GET` | `/produtos/{id}/vendas/timeline` | Série temporal diária de vendas (query param `days`, 1–3650) ⭐ |
| `GET` | `/produtos/{id}/health-score` | Score de saúde do produto (0–100) ⭐ |
| `GET` | `/categorias/stats` | KPIs agregados por categoria (produtos, receita, vendas, avaliação, imagem) ⭐ |
| `GET` | `/categorias/{slug}/dashboard` | Dashboard completo de uma categoria (KPIs + top produtos + receita mensal) ⭐ |
| `POST` | `/categorias` | Cria nova categoria com imagem (retorna 409 se já existir) ⭐ |
| `GET` | `/dashboard/stats` | Métricas gerais do e-commerce (KPIs, receita mensal, status, top categorias/produtos) ⭐ |
| `GET` | `/dashboard/receita-diaria` | Receita diária de um mês (query params `ano`, `mes`) ⭐ |
| `GET` | `/dashboard/stats-mes` | KPIs mensais (receita, ticket médio, pedidos, clientes, produtos), pedidos por status e top categorias filtrados por mês (query params `ano`, `mes`) ⭐ |

---

## Extras implementados ⭐

Funcionalidades adicionadas além dos requisitos originais da atividade.

### Backend

| Recurso | Detalhes |
|---|---|
| **Health Score** (`GET /produtos/{id}/health-score`) | Pontuação de 0 a 100 calculada a partir de três componentes: média de avaliações (até 50 pts), volume de vendas nos últimos 30 dias (até 30 pts) e taxa de não-cancelamento (até 20 pts) |
| **Timeline de vendas** (`GET /produtos/{id}/vendas/timeline?days=N`) | Série temporal diária de quantidade e receita para os últimos N dias (1 a 3650), usando `func.date()` do SQLite — cobre todo o histórico desde 2018 |
| **Dashboard de métricas** (`GET /dashboard/stats`) | Endpoint agregado com: totais de produtos, pedidos, clientes e receita; receita por mês (todos os anos); pedidos por status; top 10 categorias por receita; top 10 produtos por receita |
| **Receita diária** (`GET /dashboard/receita-diaria?ano&mes`) | Série temporal diária de receita e contagem de pedidos para o mês especificado, via `strftime` no SQLite |
| **Stats por mês** (`GET /dashboard/stats-mes?ano&mes`) | KPIs mensais calculados via `COUNT(DISTINCT ...)`: receita, ticket médio, total de pedidos, clientes únicos e produtos distintos vendidos no mês; também retorna pedidos por status e top 10 categorias por receita |
| **KPIs de categorias** (`GET /categorias/stats`) | Para cada categoria: total de produtos, receita, vendas, média de avaliações e URL da imagem; inclui categorias sem produtos ainda cadastrados |
| **Dashboard de categoria** (`GET /categorias/{slug}/dashboard`) | Métricas completas de uma categoria: KPIs, ticket médio, top 10 produtos por receita e receita mensal histórica |
| **Criar categoria** (`POST /categorias`) | Insere nova entrada em `categoria_imagens` com nome (slug) e URL de imagem sem limite de tamanho; retorna 409 em duplicata |

### Frontend

| Recurso | Detalhes |
|---|---|
| **Design System (shadcn/ui)** | Arquitetura de componentes baseada no shadcn/ui, utilizando o tweakcn para customização exclusiva do tema.|
| **Dark mode** | Toggle no menu lateral com persistência via `localStorage`; sem flash na inicialização |
| **Menu lateral (Sidebar)** | Substitui a navbar superior; navegação entre Dashboard e Catálogo; toggle de tema na base |
| **Dashboard analítico** | Página inicial dividida em duas seções: **Visão Mensal** (5 KPI cards do mês selecionado — receita, ticket médio, pedidos, clientes e produtos vendidos — gráfico de área de receita diária e dois gráficos de barras horizontais de pedidos por status e top categorias) e **Métricas Totais** (5 KPI cards históricos acumulados, histórico anual comparativo, top categorias e tabela dos top 10 produtos) |
| **Health Score Ring** | Anel SVG animado no cabeçalho da página de detalhes com cor semântica (verde ≥ 80, amarelo ≥ 50, vermelho < 50) |
| **Busca ao vivo** | A barra de pesquisa do catálogo dispara automaticamente com debounce de 400 ms, letra por letra, sem necessidade de confirmar |
| **Simulador de preço** | Slider no formulário de edição que projeta quantas unidades/mês são necessárias para manter a receita atual caso o preço médio mude |
| **Gráfico de timeline histórico** | Aba "Desempenho" na página de detalhes com `AreaChart` (recharts); botões de período: 30 dias, 6 meses, 1 ano, 2 anos, 5 anos e Tudo (padrão: 1 ano) |
| **Visualização em tabela** | Toggle grade/tabela no catálogo usando `@tanstack/react-table`; a coluna de categoria suporta edição inline diretamente na célula (clique → `<select>` → Enter/blur salva, Escape cancela) |
| **Categoria por dropdown** | No formulário de produto a categoria é selecionada exclusivamente pelo dropdown de categorias existentes, sem campo de texto livre |
| **Cores por categoria** | Badges coloridos para cada grupo de categoria (eletrônicos = azul, games = violeta, moda = rosa, casa = âmbar, etc.) |
| **Formatação de nomes e categorias** | `formatNomeProduto` remove artefatos de escape CSV; `formatCategoria` converte slugs snake_case para rótulos legíveis em português |
| **Animações de layout** | Cards do catálogo animam com `framer-motion` (`layout` prop) ao filtrar; entrada das seções da página de detalhes é escalonada (`staggerChildren: 0.08s`) |
| **Botão de salvar animado** | Três estados com `AnimatePresence`: ícone de salvar → spinner giratório → ícone de check (verde), seguido de redirecionamento automático |
| **Empty states acionáveis** | Telas vazias de avaliações e vendas incluem botões de ação contextuais (ex.: "Editar Produto", "Ver Catálogo") |
| **Numerais tabulares** | Classe `tabular-nums` em todos os valores numéricos (KPIs, tabelas de vendas) para alinhamento visual consistente |
| **Página de Categorias** (`/categorias`) | Grid visual de todas as categorias com banner de imagem, 4 KPIs por card (produtos, vendas, receita, avaliação média), badges de ranking (Trophy/Medal/Award) para o top 3, busca por nome e ordenação por receita, avaliação, produtos ou vendas |
| **Detalhe de Categoria** (`/categorias/:slug`) | Dashboard individual por categoria: banner com imagem, KPI cards, ticket médio, gráfico de área com receita mensal e tabela dos top 10 produtos com link direto ao detalhe |
| **Criar Categoria** | Dialog acessível pelo botão "Nova Categoria" na página de categorias; campo de nome (convertido automaticamente para slug), URL de imagem sem restrição de formato/tamanho e preview ao vivo — submit liberado mesmo que o preview não carregue (hotlink/CORS) |
| **Seletor de Mês/Ano** | Componente `MonthPicker` no card de receita diária: botão trigger `Mês Ano ▼` abre dropdown com navegação por ano (`< 2023 >`) e grade 4×3 dos 12 meses; meses com dados marcados com ponto indicador; meses futuros desabilitados; setas `‹ ›` laterais para navegação rápida; seleção persiste durante a navegação SPA e reseta no reload |
| **Charts filtrados por mês** | "Pedidos por Status" e "Top Categorias por Receita" seguem o mês selecionado no gráfico de receita diária, com título contextual, spinner e empty state individuais; exibidos na seção Visão Mensal |
| **Histórico Anual Comparativo** | `LineChart` multi-série na seção Métricas Totais (uma linha por ano); botões de toggle coloridos por ano (cor do botão = cor da linha); mínimo de 1 ano sempre ativo; dados derivados de `receita_por_mes` sem request adicional |
| **Atalho de Categorias no Dashboard** | Card "Top Categorias" com os 4 departamentos de maior receita exibidos como mini cards com imagem e receita; link "Ver todas" navega para `/categorias`; exibido na seção Métricas Totais |

---

## Estrutura do projeto

```
.
├── backend/
│   ├── app/
│   │   ├── models/
│   │   │   ├── avaliacao_pedido.py  # Avaliações dos pedidos
│   │   │   ├── categoria_imagem.py  # Imagens por categoria (PK: slug)
│   │   │   ├── consumidor.py
│   │   │   ├── item_pedido.py
│   │   │   ├── pedido.py
│   │   │   ├── produto.py
│   │   │   └── vendedor.py
│   │   ├── routers/
│   │   │   ├── alertas.py           # Feed de alertas operacionais
│   │   │   ├── avaliacoes.py        # Avaliações e stats por produto
│   │   │   ├── categorias.py        # Stats, dashboard e criação de categorias
│   │   │   ├── dashboard.py         # Métricas gerais, receita diária e stats por mês
│   │   │   ├── health_score.py      # Score de saúde do produto (0–100)
│   │   │   ├── produtos.py          # CRUD de produtos + listagem de categorias
│   │   │   └── vendas.py            # Vendas, stats e timeline por produto
│   │   ├── schemas/
│   │   │   ├── alerta.py
│   │   │   ├── avaliacao.py
│   │   │   ├── categoria.py         # CategoriaStatsItem, CategoriaDashboard, CategoriaCreate
│   │   │   ├── dashboard.py         # DashboardStats, DashboardMesStats, ReceitaDiariaItem
│   │   │   ├── health_score.py
│   │   │   ├── produto.py
│   │   │   └── venda.py
│   │   ├── config.py                # Configuração (DATABASE_URL)
│   │   ├── database.py              # Engine + sessão SQLAlchemy
│   │   └── main.py                  # App FastAPI + CORS + registro de routers
│   ├── alembic/                     # Migrações do banco
│   ├── DatabaseCsvs/                # CSVs de seed (produtos, pedidos, avaliações…)
│   ├── seed.py                      # Script de carga inicial do banco
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── ui/                  # Componentes shadcn/ui (button, card, dialog…)
    │   │   ├── HealthScoreRing.tsx  # Anel SVG animado de health score
    │   │   ├── Sidebar.tsx          # Menu lateral com navegação e toggle de tema
    │   │   └── ThemeToggle.tsx      # Botão dark/light mode
    │   ├── hooks/
    │   │   └── use-toast.ts
    │   ├── lib/
    │   │   ├── api.ts               # Todas as chamadas à API (fetch + tipagens)
    │   │   └── utils.ts             # formatCategoria, formatNomeProduto, getCategoriaColor
    │   ├── pages/
    │   │   ├── CatalogPage.tsx         # Catálogo paginado com busca, filtros, grade/tabela
    │   │   ├── CategoriaDetailPage.tsx # Dashboard individual por categoria
    │   │   ├── CategoriasPage.tsx      # Grid de categorias com KPIs e criação
    │   │   ├── DashboardPage.tsx       # Dashboard com seletor de mês e histórico anual
    │   │   ├── ProductDetailPage.tsx   # Detalhe do produto com tabs e health score
    │   │   └── ProductFormPage.tsx     # Formulário de criação/edição de produto
    │   ├── types/
    │   │   └── index.ts             # Todas as interfaces TypeScript da aplicação
    │   ├── App.tsx                  # Roteamento SPA (React Router)
    │   ├── index.css                # Tema Tailwind v4 (variáveis oklch)
    │   └── main.tsx
    ├── package.json
    └── .env.example
```
