import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ImageOff,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { api } from "@/lib/api";
import { formatCategoria, formatNomeProduto } from "@/lib/utils";
import type { CategoriaStats, DashboardStats, ReceitaDiariaItem } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatCurrencyShort(value: number) {
  if (value >= 1_000_000) return `R$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `R$${(value / 1_000).toFixed(0)}k`;
  return `R$${value.toFixed(0)}`;
}

function formatMonth(mes: string) {
  const [year, month] = mes.split("-");
  return new Date(Number(year), Number(month) - 1).toLocaleDateString("pt-BR", {
    month: "short",
    year: "2-digit",
  });
}

const STATUS_COLORS: Record<string, string> = {
  entregue: "#22c55e",
  faturado: "#3b82f6",
  enviado: "#6366f1",
  "em processamento": "#f59e0b",
  aprovado: "#8b5cf6",
  criado: "#64748b",
  cancelado: "#ef4444",
  "indisponível": "#9ca3af",
};

const CATEGORY_COLORS = [
  "#f97316", "#3b82f6", "#8b5cf6", "#22c55e",
  "#ec4899", "#f59e0b", "#06b6d4", "#64748b",
  "#a3e635", "#e879f9",
];

// Persiste durante navegação SPA; reseta no reload da página
let _mesSelecionado: { ano: number; mes: number } | null = null;

const MESES_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function mesAnterior(ano: number, mes: number) {
  return mes === 1 ? { ano: ano - 1, mes: 12 } : { ano, mes: mes - 1 };
}
function mesPosterior(ano: number, mes: number) {
  return mes === 12 ? { ano: ano + 1, mes: 1 } : { ano, mes: mes + 1 };
}
function mesParaStr(ano: number, mes: number) {
  return `${ano}-${String(mes).padStart(2, "0")}`;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topCategorias, setTopCategorias] = useState<CategoriaStats[]>([]);
  const [loading, setLoading] = useState(true);

  const hoje = new Date();
  const [mesSelecionado, setMesSelecionado] = useState<{ ano: number; mes: number }>(
    _mesSelecionado ?? { ano: hoje.getFullYear(), mes: hoje.getMonth() + 1 }
  );
  const [receitaDiaria, setReceitaDiaria] = useState<ReceitaDiariaItem[]>([]);
  const [loadingDiario, setLoadingDiario] = useState(false);

  useEffect(() => {
    api.getDashboardStats()
      .then(setStats)
      .finally(() => setLoading(false));
    api.getCategoriasStats().then((cats) =>
      setTopCategorias(
        [...cats].sort((a, b) => b.receita_total - a.receita_total).slice(0, 4)
      )
    );
  }, []);

  useEffect(() => {
    _mesSelecionado = mesSelecionado;
    setLoadingDiario(true);
    api
      .getDashboardReceitaDiaria(mesSelecionado.ano, mesSelecionado.mes)
      .then(setReceitaDiaria)
      .finally(() => setLoadingDiario(false));
  }, [mesSelecionado]);

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="h-72 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Visão geral do e-commerce
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" /> Receita Total
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold tabular-nums">
              {formatCurrencyShort(stats.receita_total)}
            </div>
            {stats.ticket_medio != null && (
              <p className="text-xs text-muted-foreground mt-1">
                Ticket médio: {formatCurrency(stats.ticket_medio)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <ShoppingCart className="h-3.5 w-3.5" /> Total de Pedidos
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold tabular-nums">
              {stats.total_pedidos.toLocaleString("pt-BR")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" /> Clientes
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold tabular-nums">
              {stats.total_consumidores.toLocaleString("pt-BR")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5" /> Produtos
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold tabular-nums">
              {stats.total_produtos.toLocaleString("pt-BR")}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Receita diária com seletor de mês */}
      {(() => {
        const mesesDisponiveis = stats.receita_por_mes.map((r) => r.mes);
        const primeiromes = mesesDisponiveis[0];
        const mesAtualStr = mesParaStr(hoje.getFullYear(), hoje.getMonth() + 1);
        const mesSelecionadoStr = mesParaStr(mesSelecionado.ano, mesSelecionado.mes);
        const podePrev = primeiromes ? mesSelecionadoStr > primeiromes : false;
        const podeNext = mesSelecionadoStr < mesAtualStr;
        const prev = mesAnterior(mesSelecionado.ano, mesSelecionado.mes);
        const next = mesPosterior(mesSelecionado.ano, mesSelecionado.mes);

        return (
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Receita Diária</CardTitle>
              <div className="flex items-center gap-1">
                <button
                  className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  disabled={!podePrev}
                  onClick={() => setMesSelecionado(prev)}
                  aria-label="Mês anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-medium tabular-nums w-36 text-center">
                  {MESES_PT[mesSelecionado.mes - 1]} {mesSelecionado.ano}
                </span>
                <button
                  className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  disabled={!podeNext}
                  onClick={() => setMesSelecionado(next)}
                  aria-label="Próximo mês"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingDiario ? (
                <div className="h-[240px] flex items-center justify-center">
                  <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : receitaDiaria.length === 0 ? (
                <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">
                  Sem dados para {MESES_PT[mesSelecionado.mes - 1]} {mesSelecionado.ano}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart
                    data={receitaDiaria}
                    margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="dashReceitaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis
                      dataKey="dia"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(dia: string) => dia.slice(8)}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      tickFormatter={formatCurrencyShort}
                      width={64}
                    />
                    <Tooltip
                      formatter={(value) => [formatCurrency(Number(value)), "Receita"]}
                      labelFormatter={(dia) =>
                        new Date(String(dia) + "T00:00:00").toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="receita"
                      stroke="var(--color-primary)"
                      fill="url(#dashReceitaGrad)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        );
      })()}

      {/* Status + Top categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Pedidos por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={stats.pedidos_por_status}
                layout="vertical"
                margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => v.toLocaleString("pt-BR")} />
                <YAxis
                  type="category"
                  dataKey="status"
                  tick={{ fontSize: 10 }}
                  width={110}
                />
                <Tooltip
                  formatter={(value) => [Number(value).toLocaleString("pt-BR"), "Pedidos"]}
                />
                <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                  {stats.pedidos_por_status.map((entry) => (
                    <Cell
                      key={entry.status}
                      fill={STATUS_COLORS[entry.status] ?? "#64748b"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top categories */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Top Categorias por Receita</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={stats.top_categorias}
                layout="vertical"
                margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10 }}
                  tickFormatter={formatCurrencyShort}
                />
                <YAxis
                  type="category"
                  dataKey="categoria"
                  tick={{ fontSize: 10 }}
                  width={110}
                  tickFormatter={formatCategoria}
                />
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value)), "Receita"]}
                  labelFormatter={(label) => formatCategoria(String(label ?? ""))}
                />
                <Bar dataKey="receita" radius={[0, 4, 4, 0]}>
                  {stats.top_categorias.map((entry, i) => (
                    <Cell key={entry.categoria} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Atalho categorias */}
      {topCategorias.length > 0 && (
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Top Categorias</CardTitle>
            <button
              className="text-xs text-primary hover:underline flex items-center gap-1"
              onClick={() => navigate("/categorias")}
            >
              Ver todas <ArrowRight className="h-3 w-3" />
            </button>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {topCategorias.map((cat) => (
              <div
                key={cat.categoria}
                className="rounded-lg overflow-hidden border cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all group"
                onClick={() => navigate(`/categorias/${cat.categoria}`)}
              >
                <div className="relative h-20 bg-muted overflow-hidden">
                  {cat.link_imagem ? (
                    <img
                      src={cat.link_imagem}
                      alt={formatCategoria(cat.categoria)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <ImageOff className="h-6 w-6 opacity-30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>
                <div className="px-3 py-2">
                  <p className="text-xs font-medium line-clamp-1">{formatCategoria(cat.categoria)}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {formatCurrencyShort(cat.receita_total)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Top products table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Top 10 Produtos por Receita</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground w-8">#</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Produto</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Vendas</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Receita</th>
                <th className="px-4 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {stats.top_produtos.map((p, idx) => (
                <tr key={p.id_produto} className={idx % 2 === 0 ? "" : "bg-muted/20"}>
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium max-w-xs truncate">
                    {formatNomeProduto(p.nome_produto)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{p.total_vendas.toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">
                    {formatCurrency(p.receita)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      className="text-xs text-primary hover:underline"
                      onClick={() => navigate(`/produtos/${p.id_produto}`)}
                    >
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
