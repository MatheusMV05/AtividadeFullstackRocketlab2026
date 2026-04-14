import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ChevronDown,
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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { api } from "@/lib/api";
import { formatCategoria, formatNomeProduto } from "@/lib/utils";
import type { CategoriaStats, DashboardMesStats, DashboardStats, ReceitaDiariaItem } from "@/types";
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
const MESES_CURTO = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

function mesParaStr(ano: number, mes: number) {
  return `${ano}-${String(mes).padStart(2, "0")}`;
}

interface MonthPickerProps {
  value: { ano: number; mes: number };
  onChange: (v: { ano: number; mes: number }) => void;
  mesesComDados: Set<string>;
  anoMinimo: number;
}

function MonthPicker({ value, onChange, mesesComDados, anoMinimo }: MonthPickerProps) {
  const hoje = new Date();
  const anoMaximo = hoje.getFullYear();
  const mesMaximoStr = mesParaStr(anoMaximo, hoje.getMonth() + 1);

  const [aberto, setAberto] = useState(false);
  const [anoVisualizando, setAnoVisualizando] = useState(value.ano);
  const ref = useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora
  useEffect(() => {
    if (!aberto) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [aberto]);

  // Sincroniza o ano visualizado quando o valor externo muda (prev/next)
  useEffect(() => {
    setAnoVisualizando(value.ano);
  }, [value.ano]);

  function selecionar(mes: number) {
    onChange({ ano: anoVisualizando, mes });
    setAberto(false);
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setAberto((o) => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-sm font-medium hover:bg-muted transition-colors"
      >
        {MESES_PT[value.mes - 1]} {value.ano}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${aberto ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      {aberto && (
        <div className="absolute right-0 top-full mt-1.5 z-50 rounded-lg border bg-popover shadow-lg p-3 w-56">
          {/* Navegação de ano */}
          <div className="flex items-center justify-between mb-3">
            <button
              className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              disabled={anoVisualizando <= anoMinimo}
              onClick={() => setAnoVisualizando((a) => a - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold tabular-nums">{anoVisualizando}</span>
            <button
              className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              disabled={anoVisualizando >= anoMaximo}
              onClick={() => setAnoVisualizando((a) => a + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Grade de meses */}
          <div className="grid grid-cols-4 gap-1">
            {MESES_CURTO.map((nome, idx) => {
              const m = idx + 1;
              const str = mesParaStr(anoVisualizando, m);
              const isFuturo = str > mesMaximoStr;
              const temDados = mesesComDados.has(str);
              const isSelecionado = value.ano === anoVisualizando && value.mes === m;

              return (
                <button
                  key={m}
                  disabled={isFuturo}
                  onClick={() => selecionar(m)}
                  className={[
                    "relative flex flex-col items-center justify-center rounded-md py-1.5 text-xs font-medium transition-colors",
                    isSelecionado
                      ? "bg-primary text-primary-foreground"
                      : isFuturo
                      ? "opacity-30 cursor-not-allowed"
                      : temDados
                      ? "hover:bg-muted"
                      : "text-muted-foreground hover:bg-muted",
                  ].join(" ")}
                >
                  {nome}
                  {/* Ponto indicador de dados */}
                  {temDados && !isSelecionado && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
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
  const [statsMes, setStatsMes] = useState<DashboardMesStats | null>(null);
  const [anosHistoricoSelecionados, setAnosHistoricoSelecionados] = useState<number[]>([]);

  useEffect(() => {
    api.getDashboardStats()
      .then((s) => {
        setStats(s);
        // Inicializa todos os anos disponíveis como selecionados
        const anos = [...new Set(s.receita_por_mes.map((r) => Number(r.mes.slice(0, 4))))].sort();
        setAnosHistoricoSelecionados(anos);
      })
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
    setStatsMes(null);
    Promise.all([
      api.getDashboardReceitaDiaria(mesSelecionado.ano, mesSelecionado.mes),
      api.getDashboardStatsMes(mesSelecionado.ano, mesSelecionado.mes),
    ]).then(([diario, mes]) => {
      setReceitaDiaria(diario);
      setStatsMes(mes);
    }).finally(() => setLoadingDiario(false));
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
        const mesesComDados = new Set(stats.receita_por_mes.map((r) => r.mes));
        const mesesLista = stats.receita_por_mes.map((r) => r.mes).sort();
        const anoMinimo = mesesLista.length > 0 ? Number(mesesLista[0].slice(0, 4)) : hoje.getFullYear();
        const mesAtualStr = mesParaStr(hoje.getFullYear(), hoje.getMonth() + 1);
        const mesSelecionadoStr = mesParaStr(mesSelecionado.ano, mesSelecionado.mes);

        const podePrev = mesesLista.length > 0 && mesSelecionadoStr > mesesLista[0];
        const podeNext = mesSelecionadoStr < mesAtualStr;

        function prevMes() {
          setMesSelecionado(mesSelecionado.mes === 1
            ? { ano: mesSelecionado.ano - 1, mes: 12 }
            : { ano: mesSelecionado.ano, mes: mesSelecionado.mes - 1 });
        }
        function nextMes() {
          setMesSelecionado(mesSelecionado.mes === 12
            ? { ano: mesSelecionado.ano + 1, mes: 1 }
            : { ano: mesSelecionado.ano, mes: mesSelecionado.mes + 1 });
        }

        return (
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Receita Diária</CardTitle>
              <div className="flex items-center gap-1">
                <button
                  className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  disabled={!podePrev}
                  onClick={prevMes}
                  aria-label="Mês anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <MonthPicker
                  value={mesSelecionado}
                  onChange={setMesSelecionado}
                  mesesComDados={mesesComDados}
                  anoMinimo={anoMinimo}
                />
                <button
                  className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  disabled={!podeNext}
                  onClick={nextMes}
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

      {/* Status + Top categories — filtrados pelo mês selecionado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              Pedidos por Status — {MESES_PT[mesSelecionado.mes - 1]} {mesSelecionado.ano}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!statsMes || loadingDiario ? (
              <div className="h-[220px] flex items-center justify-center">
                <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : statsMes.pedidos_por_status.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                Sem pedidos neste mês
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={statsMes.pedidos_por_status}
                  layout="vertical"
                  margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => v.toLocaleString("pt-BR")} />
                  <YAxis type="category" dataKey="status" tick={{ fontSize: 10 }} width={110} />
                  <Tooltip formatter={(value) => [Number(value).toLocaleString("pt-BR"), "Pedidos"]} />
                  <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                    {statsMes.pedidos_por_status.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "#64748b"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              Top Categorias — {MESES_PT[mesSelecionado.mes - 1]} {mesSelecionado.ano}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!statsMes || loadingDiario ? (
              <div className="h-[220px] flex items-center justify-center">
                <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : statsMes.top_categorias.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                Sem vendas neste mês
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={statsMes.top_categorias}
                  layout="vertical"
                  margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={formatCurrencyShort} />
                  <YAxis type="category" dataKey="categoria" tick={{ fontSize: 10 }} width={110} tickFormatter={formatCategoria} />
                  <Tooltip
                    formatter={(value) => [formatCurrency(Number(value)), "Receita"]}
                    labelFormatter={(label) => formatCategoria(String(label ?? ""))}
                  />
                  <Bar dataKey="receita" radius={[0, 4, 4, 0]}>
                    {statsMes.top_categorias.map((entry, i) => (
                      <Cell key={entry.categoria} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Histórico anual — comparativo multi-ano */}
      {stats.receita_por_mes.length > 0 && (() => {
        const anosDisponiveis = [...new Set(
          stats.receita_por_mes.map((r) => Number(r.mes.slice(0, 4)))
        )].sort();

        // Transforma em [{mesNum, label, "2023": val, "2024": val, ...}]
        const porMes: Record<number, Record<string, number>> = {};
        for (let m = 1; m <= 12; m++) porMes[m] = {};
        for (const item of stats.receita_por_mes) {
          const ano = Number(item.mes.slice(0, 4));
          const mes = Number(item.mes.slice(5, 7));
          if (anosHistoricoSelecionados.includes(ano)) {
            porMes[mes][String(ano)] = (porMes[mes][String(ano)] ?? 0) + item.receita;
          }
        }
        const historicoData = Array.from({ length: 12 }, (_, i) => ({
          mesNum: i + 1,
          label: MESES_CURTO[i],
          ...porMes[i + 1],
        }));

        const coresAnos = ["#3b82f6", "#f97316", "#22c55e", "#8b5cf6", "#ec4899", "#f59e0b"];

        function toggleAno(ano: number) {
          setAnosHistoricoSelecionados((prev) =>
            prev.includes(ano)
              ? prev.length > 1 ? prev.filter((a) => a !== ano) : prev
              : [...prev, ano].sort()
          );
        }

        return (
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-sm font-semibold">Histórico de Receita por Ano</CardTitle>
              <div className="flex items-center gap-1.5 flex-wrap">
                {anosDisponiveis.map((ano, i) => {
                  const ativo = anosHistoricoSelecionados.includes(ano);
                  return (
                    <button
                      key={ano}
                      onClick={() => toggleAno(ano)}
                      className={[
                        "px-2.5 py-1 rounded-md text-xs font-medium border transition-colors",
                        ativo
                          ? "text-white border-transparent"
                          : "bg-transparent text-muted-foreground border-border hover:border-foreground",
                      ].join(" ")}
                      style={ativo ? { backgroundColor: coresAnos[i % coresAnos.length], borderColor: coresAnos[i % coresAnos.length] } : {}}
                    >
                      {ano}
                    </button>
                  );
                })}
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={historicoData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={formatCurrencyShort} width={64} />
                  <Tooltip
                    formatter={(value, name) => [formatCurrency(Number(value)), String(name)]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {anosHistoricoSelecionados.map((ano, i) => (
                    <Line
                      key={ano}
                      type="monotone"
                      dataKey={String(ano)}
                      stroke={coresAnos[anosDisponiveis.indexOf(ano) % coresAnos.length]}
                      strokeWidth={2}
                      dot={false}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        );
      })()}

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
