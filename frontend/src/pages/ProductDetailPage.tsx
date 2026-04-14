import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BarChart2,
  MessageSquare,
  Package,
  Pencil,
  Ruler,
  ShoppingBag,
  ShoppingCart,
  Star,
  TrendingUp,
  Trash2,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { api } from "@/lib/api";
import { formatCategoria, formatNomeProduto, getCategoriaColor } from "@/lib/utils";
import type {
  AvaliacaoResponse,
  AvaliacaoStats,
  HealthScore,
  Produto,
  VendaResponse,
  VendaStats,
  VendaTimelineEntry,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { HealthScoreRing } from "@/components/HealthScoreRing";
import { toast } from "@/hooks/use-toast";

const pageVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
          }`}
        />
      ))}
    </div>
  );
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type ActiveTab = "avaliacoes" | "vendas" | "desempenho";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [produto, setProduto] = useState<Produto | null>(null);
  const [avaliacaoStats, setAvaliacaoStats] = useState<AvaliacaoStats | null>(null);
  const [vendaStats, setVendaStats] = useState<VendaStats | null>(null);
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoResponse[]>([]);
  const [vendas, setVendas] = useState<VendaResponse[]>([]);
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null);
  const [timeline, setTimeline] = useState<VendaTimelineEntry[]>([]);
  const [timelineDays, setTimelineDays] = useState<30 | 180 | 365 | 730 | 1825 | 3650>(365);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("avaliacoes");
  const [avaliacoesVisiveis, setAvaliacoesVisiveis] = useState(20);
  const [vendasVisiveis, setVendasVisiveis] = useState(50);

  useEffect(() => {
    setAvaliacoesVisiveis(20);
    setVendasVisiveis(50);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.getProduto(id),
      api.getAvaliacaoStats(id),
      api.getVendaStats(id),
      api.getAvaliacoes(id),
      api.getVendas(id),
      api.getHealthScore(id),
    ])
      .then(([p, as, vs, avs, vds, hs]) => {
        setProduto(p);
        setAvaliacaoStats(as);
        setVendaStats(vs);
        setAvaliacoes(avs);
        setVendas(vds);
        setHealthScore(hs);
      })
      .catch(() => {
        toast({ title: "Erro ao carregar produto", variant: "destructive" });
        navigate("/");
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  useEffect(() => {
    if (!id) return;
    api.getVendaTimeline(id, timelineDays).then(setTimeline).catch(() => {});
  }, [id, timelineDays]);

  async function handleDelete() {
    if (!id) return;
    try {
      await api.removerProduto(id);
      toast({ title: "Produto removido com sucesso" });
      navigate("/produtos");
    } catch {
      toast({ title: "Erro ao remover produto", variant: "destructive" });
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-32 bg-muted rounded" />
          <div className="h-48 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!produto) return null;

  return (
    <motion.div
      className="container mx-auto px-4 py-8 max-w-5xl"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Voltar */}
      <motion.div variants={itemVariants}>
        <Button variant="ghost" size="sm" className="mb-6 -ml-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
          Voltar ao catálogo
        </Button>
      </motion.div>

      {/* Header do produto */}
      <motion.div
        variants={itemVariants}
        className="flex items-start justify-between mb-6 gap-4"
      >
        <div className="flex-1">
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium mb-2 inline-block ${getCategoriaColor(produto.categoria_produto)}`}
          >
            {formatCategoria(produto.categoria_produto)}
          </span>
          <motion.h1
            layoutId={`product-title-${id}`}
            className="text-2xl font-bold tracking-tight mt-1"
          >
            {formatNomeProduto(produto.nome_produto)}
          </motion.h1>
          <p className="text-xs text-muted-foreground mt-1 font-mono">ID: {produto.id_produto}</p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          {healthScore && <HealthScoreRing score={healthScore.score} />}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/produtos/${id}/editar`)}
            >
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4" />
                  Remover
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remover produto</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja remover{" "}
                    <strong>{formatNomeProduto(produto.nome_produto)}</strong>? Esta ação não pode
                    ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Remover
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <ShoppingCart className="h-3.5 w-3.5" /> Total de Vendas
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold tabular-nums">
              {vendaStats?.total_vendas ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" /> Receita Total
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold tabular-nums">
              {vendaStats ? formatCurrency(vendaStats.receita_total) : "—"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Star className="h-3.5 w-3.5" /> Média de Avaliação
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold tabular-nums">
              {avaliacaoStats?.media_avaliacao != null
                ? `${avaliacaoStats.media_avaliacao.toFixed(1)} / 5`
                : "—"}
            </div>
            {avaliacaoStats?.media_avaliacao != null && (
              <StarRating value={Math.round(avaliacaoStats.media_avaliacao)} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" /> Avaliações
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold tabular-nums">
              {avaliacaoStats?.total_avaliacoes ?? 0}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Informações do produto */}
      <motion.div variants={itemVariants}>
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Package className="h-4 w-4" /> Informações do Produto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Peso</p>
                <p className="font-medium tabular-nums">
                  {produto.peso_produto_gramas != null ? `${produto.peso_produto_gramas} g` : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Ruler className="h-3 w-3" /> Comprimento
                </p>
                <p className="font-medium tabular-nums">
                  {produto.comprimento_centimetros != null
                    ? `${produto.comprimento_centimetros} cm`
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Ruler className="h-3 w-3" /> Largura
                </p>
                <p className="font-medium tabular-nums">
                  {produto.largura_centimetros != null
                    ? `${produto.largura_centimetros} cm`
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Ruler className="h-3 w-3" /> Altura
                </p>
                <p className="font-medium tabular-nums">
                  {produto.altura_centimetros != null
                    ? `${produto.altura_centimetros} cm`
                    : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Distribuição de avaliações */}
      {avaliacaoStats && avaliacaoStats.total_avaliacoes > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Star className="h-4 w-4" /> Distribuição de Avaliações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((nota) => {
                  const count = avaliacaoStats.distribuicao[String(nota)] ?? 0;
                  const pct =
                    avaliacaoStats.total_avaliacoes > 0
                      ? Math.round((count / avaliacaoStats.total_avaliacoes) * 100)
                      : 0;
                  return (
                    <div key={nota} className="flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-1 w-12 shrink-0">
                        <span className="tabular-nums">{nota}</span>
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      </div>
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div
                          className="bg-yellow-400 h-2 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-muted-foreground w-10 text-right tabular-nums">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Tabs */}
      <motion.div variants={itemVariants}>
        <div className="flex gap-1 mb-4 border-b">
          {(["avaliacoes", "vendas", "desempenho"] as ActiveTab[]).map((tab) => {
            const labels: Record<ActiveTab, string> = {
              avaliacoes: `Avaliações (${avaliacaoStats?.total_avaliacoes ?? avaliacoes.length})`,
              vendas: `Vendas (${vendaStats?.total_vendas ?? vendas.length})`,
              desempenho: "Desempenho",
            };
            return (
              <button
                key={tab}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* Tab: Avaliações */}
        {activeTab === "avaliacoes" && (
          <div className="space-y-3">
            {avaliacoes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                <MessageSquare className="h-10 w-10" />
                <p className="font-medium">Nenhuma avaliação encontrada</p>
                <p className="text-sm text-center">
                  Este produto ainda não recebeu avaliações.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/produtos/${id}/editar`)}
                >
                  Criar Promoção
                </Button>
              </div>
            ) : (
              <>
                {avaliacoes.slice(0, avaliacoesVisiveis).map((av) => (
                  <Card key={av.id_avaliacao}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-2">
                        <StarRating value={av.avaliacao} />
                        <span className="text-xs text-muted-foreground">
                          {formatDate(av.data_comentario)}
                        </span>
                      </div>
                      {av.titulo_comentario && (
                        <p className="font-medium text-sm mt-2">{av.titulo_comentario}</p>
                      )}
                      {av.comentario && (
                        <p className="text-sm text-muted-foreground mt-1">{av.comentario}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {avaliacoesVisiveis < avaliacoes.length && (
                  <div className="flex justify-center pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAvaliacoesVisiveis((v) => v + 20)}
                    >
                      Ver mais ({avaliacoes.length - avaliacoesVisiveis} restantes)
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Tab: Vendas */}
        {activeTab === "vendas" && (
          <div className="space-y-3">
            {vendas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                <ShoppingBag className="h-10 w-10" />
                <p className="font-medium">Nenhuma venda registrada</p>
                <p className="text-sm text-center">
                  Este produto ainda não possui vendas.
                </p>
                <Button variant="outline" size="sm" onClick={() => navigate("/produtos")}>
                  Ver Catálogo
                </Button>
              </div>
            ) : (
              <>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Data</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                        <th className="text-right px-4 py-3 font-medium text-muted-foreground">Preço</th>
                        <th className="text-right px-4 py-3 font-medium text-muted-foreground">Frete</th>
                        <th className="text-center px-4 py-3 font-medium text-muted-foreground">No Prazo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendas.slice(0, vendasVisiveis).map((v, idx) => (
                        <tr
                          key={`${v.id_pedido}-${v.id_item}`}
                          className={idx % 2 === 0 ? "" : "bg-muted/20"}
                        >
                          <td className="px-4 py-3">{formatDate(v.pedido_compra_timestamp)}</td>
                          <td className="px-4 py-3">
                            <Badge
                              variant={
                                v.status === "entregue"
                                  ? "default"
                                  : v.status === "cancelado"
                                  ? "destructive"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {v.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {formatCurrency(v.preco_BRL)}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {formatCurrency(v.preco_frete)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {v.entrega_no_prazo === "Sim" ? (
                              <span className="text-green-600">Sim</span>
                            ) : v.entrega_no_prazo === "Não" ||
                              v.entrega_no_prazo === "Não Entregue" ? (
                              <span className="text-red-600">{v.entrega_no_prazo}</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {vendasVisiveis < vendas.length && (
                    <div className="px-4 py-3 border-t bg-muted/20 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Exibindo {vendasVisiveis} de {vendas.length} vendas
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setVendasVisiveis((v) => v + 50)}
                      >
                        Ver mais
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab: Desempenho */}
        {activeTab === "desempenho" && (
          <div>
            <div className="flex gap-2 mb-4 flex-wrap">
              {([
                [30, "30 dias"],
                [180, "6 meses"],
                [365, "1 ano"],
                [730, "2 anos"],
                [1825, "5 anos"],
                [3650, "Tudo"],
              ] as const).map(([d, label]) => (
                <Button
                  key={d}
                  variant={timelineDays === d ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setTimelineDays(d)}
                >
                  {label}
                </Button>
              ))}
            </div>
            {timeline.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                <BarChart2 className="h-10 w-10" />
                <p className="font-medium">Nenhuma venda no período selecionado</p>
                <Button variant="outline" size="sm" onClick={() => navigate("/produtos")}>
                  Ver Catálogo
                </Button>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={timeline} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="receitaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis
                    dataKey="data"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) =>
                      new Date(v + "T00:00:00").toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                      })
                    }
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) =>
                      v >= 1000
                        ? `R$${(v / 1000).toFixed(0)}k`
                        : `R$${v.toFixed(0)}`
                    }
                  />
                  <Tooltip
                    formatter={(value) => [
                      formatCurrency(Number(value)),
                      "Receita",
                    ]}
                    labelFormatter={(label) =>
                      new Date(label + "T00:00:00").toLocaleDateString("pt-BR")
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="receita"
                    stroke="var(--color-primary)"
                    fill="url(#receitaGrad)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        )}
      </motion.div>

      <Separator className="my-6" />
      <div className="text-xs text-muted-foreground">
        {vendaStats && (
          <div className="flex gap-6 flex-wrap">
            <span>
              Ticket médio:{" "}
              <span className="tabular-nums">
                {vendaStats.ticket_medio != null
                  ? formatCurrency(vendaStats.ticket_medio)
                  : "—"}
              </span>
            </span>
            <span>
              Frete médio:{" "}
              <span className="tabular-nums">
                {vendaStats.frete_medio != null ? formatCurrency(vendaStats.frete_medio) : "—"}
              </span>
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
