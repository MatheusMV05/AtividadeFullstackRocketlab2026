import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ExternalLink,
  ImageOff,
  Package,
  ShoppingCart,
  Star,
  TrendingUp,
  Receipt,
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
import { formatCategoria, formatNomeProduto } from "@/lib/utils";
import type { CategoriaDashboard } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

const pageVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

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

export default function CategoriaDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [dados, setDados] = useState<CategoriaDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api
      .getCategoriaDashboard(slug)
      .then(setDados)
      .catch(() => {
        toast({ title: "Erro ao carregar categoria", variant: "destructive" });
        navigate("/categorias");
      })
      .finally(() => setLoading(false));
  }, [slug, navigate]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl space-y-4 animate-pulse">
        <div className="h-48 bg-muted rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-lg" />
          ))}
        </div>
        <div className="h-64 bg-muted rounded-lg" />
      </div>
    );
  }

  if (!dados) return null;

  return (
    <motion.div
      className="container mx-auto px-4 py-8 max-w-5xl"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Voltar */}
      <motion.div variants={itemVariants}>
        <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => navigate("/categorias")}>
          <ArrowLeft className="h-4 w-4" />
          Voltar às categorias
        </Button>
      </motion.div>

      {/* Banner */}
      <motion.div variants={itemVariants} className="relative h-48 rounded-xl overflow-hidden bg-muted mb-6">
        {dados.link_imagem && !imgError ? (
          <img
            src={dados.link_imagem}
            alt={formatCategoria(dados.categoria)}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <ImageOff className="h-12 w-12 opacity-30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6 flex items-end justify-between w-full">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {formatCategoria(dados.categoria)}
          </h1>
          <Button
            size="sm"
            variant="secondary"
            className="shrink-0"
            onClick={() => navigate(`/produtos?categoria=${dados.categoria}`)}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Ver produtos
          </Button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5" /> Produtos
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold tabular-nums">
              {dados.total_produtos.toLocaleString("pt-BR")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <ShoppingCart className="h-3.5 w-3.5" /> Vendas
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold tabular-nums">
              {dados.total_vendas.toLocaleString("pt-BR")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" /> Receita Total
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold tabular-nums">
              {formatCurrencyShort(dados.receita_total)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5" /> Avaliação Média
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold tabular-nums">
              {dados.media_avaliacao != null ? `${dados.media_avaliacao.toFixed(1)} / 5` : "—"}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Ticket médio */}
      {dados.ticket_medio != null && (
        <motion.div variants={itemVariants} className="mb-6">
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Receipt className="h-3.5 w-3.5" /> Ticket Médio
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-bold tabular-nums">
                {formatCurrency(dados.ticket_medio)}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Gráfico receita por mês */}
      {dados.receita_por_mes.length > 0 && (
        <motion.div variants={itemVariants} className="mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Receita por Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={dados.receita_por_mes} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="catReceitaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis
                    dataKey="mes"
                    tick={{ fontSize: 10 }}
                    tickFormatter={formatMonth}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    tickFormatter={formatCurrencyShort}
                    width={64}
                  />
                  <Tooltip
                    formatter={(value) => [formatCurrency(Number(value)), "Receita"]}
                    labelFormatter={(label) => formatMonth(String(label ?? ""))}
                  />
                  <Area
                    type="monotone"
                    dataKey="receita"
                    stroke="var(--color-primary)"
                    fill="url(#catReceitaGrad)"
                    strokeWidth={2}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Top 10 produtos */}
      {dados.top_produtos.length > 0 && (
        <motion.div variants={itemVariants}>
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
                    <th className="px-4 py-3 w-16" />
                  </tr>
                </thead>
                <tbody>
                  {dados.top_produtos.map((p, idx) => (
                    <tr key={p.id_produto} className={idx % 2 === 0 ? "" : "bg-muted/20"}>
                      <td className="px-4 py-3 text-muted-foreground tabular-nums">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium max-w-xs truncate">
                        {formatNomeProduto(p.nome_produto)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {p.total_vendas.toLocaleString("pt-BR")}
                      </td>
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
        </motion.div>
      )}
    </motion.div>
  );
}
