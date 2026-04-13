import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Star,
  ShoppingCart,
  Package,
  Ruler,
  TrendingUp,
  MessageSquare,
  Pencil,
  Trash2,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatCategoria, formatNomeProduto } from "@/lib/utils";
import type {
  Produto,
  AvaliacaoStats,
  VendaStats,
  AvaliacaoResponse,
  VendaResponse,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "@/hooks/use-toast";

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i <= value
              ? "fill-yellow-400 text-yellow-400"
              : "text-muted-foreground"
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
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [produto, setProduto] = useState<Produto | null>(null);
  const [avaliacaoStats, setAvaliacaoStats] = useState<AvaliacaoStats | null>(
    null
  );
  const [vendaStats, setVendaStats] = useState<VendaStats | null>(null);
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoResponse[]>([]);
  const [vendas, setVendas] = useState<VendaResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"avaliacoes" | "vendas">(
    "avaliacoes"
  );

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.getProduto(id),
      api.getAvaliacaoStats(id),
      api.getVendaStats(id),
      api.getAvaliacoes(id),
      api.getVendas(id),
    ])
      .then(([p, as, vs, avs, vds]) => {
        setProduto(p);
        setAvaliacaoStats(as);
        setVendaStats(vs);
        setAvaliacoes(avs);
        setVendas(vds);
      })
      .catch(() => {
        toast({ title: "Erro ao carregar produto", variant: "destructive" });
        navigate("/");
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  async function handleDelete() {
    if (!id) return;
    try {
      await api.removerProduto(id);
      toast({ title: "Produto removido com sucesso" });
      navigate("/");
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
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Voltar */}
      <Button
        variant="ghost"
        size="sm"
        className="mb-6 -ml-2"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao catálogo
      </Button>

      {/* Header do produto */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div className="flex-1">
          <Badge variant="secondary" className="mb-2">
            {formatCategoria(produto.categoria_produto)}
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight">
            {formatNomeProduto(produto.nome_produto)}
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            ID: {produto.id_produto}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
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
                  Tem certeza que deseja remover <strong>{formatNomeProduto(produto.nome_produto)}</strong>?
                  Esta ação não pode ser desfeita.
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

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <ShoppingCart className="h-3.5 w-3.5" /> Total de Vendas
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold">
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
            <div className="text-2xl font-bold">
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
            <div className="text-2xl font-bold">
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
            <div className="text-2xl font-bold">
              {avaliacaoStats?.total_avaliacoes ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Medidas */}
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
              <p className="font-medium">
                {produto.peso_produto_gramas != null
                  ? `${produto.peso_produto_gramas} g`
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Ruler className="h-3 w-3" /> Comprimento
              </p>
              <p className="font-medium">
                {produto.comprimento_centimetros != null
                  ? `${produto.comprimento_centimetros} cm`
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Ruler className="h-3 w-3" /> Largura
              </p>
              <p className="font-medium">
                {produto.largura_centimetros != null
                  ? `${produto.largura_centimetros} cm`
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Ruler className="h-3 w-3" /> Altura
              </p>
              <p className="font-medium">
                {produto.altura_centimetros != null
                  ? `${produto.altura_centimetros} cm`
                  : "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Distribuição de avaliações */}
      {avaliacaoStats && avaliacaoStats.total_avaliacoes > 0 && (
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
                    ? Math.round(
                        (count / avaliacaoStats.total_avaliacoes) * 100
                      )
                    : 0;
                return (
                  <div key={nota} className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-1 w-12 shrink-0">
                      <span>{nota}</span>
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    </div>
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-muted-foreground w-10 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs Avaliações / Vendas */}
      <div className="flex gap-1 mb-4 border-b">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === "avaliacoes"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("avaliacoes")}
        >
          Avaliações ({avaliacoes.length})
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === "vendas"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("vendas")}
        >
          Vendas ({vendas.length})
        </button>
      </div>

      {/* Tab: Avaliações */}
      {activeTab === "avaliacoes" && (
        <div className="space-y-3">
          {avaliacoes.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              Nenhuma avaliação encontrada para este produto.
            </p>
          ) : (
            avaliacoes.slice(0, 20).map((av) => (
              <Card key={av.id_avaliacao}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-2">
                    <StarRating value={av.avaliacao} />
                    <span className="text-xs text-muted-foreground">
                      {formatDate(av.data_comentario)}
                    </span>
                  </div>
                  {av.titulo_comentario && (
                    <p className="font-medium text-sm mt-2">
                      {av.titulo_comentario}
                    </p>
                  )}
                  {av.comentario && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {av.comentario}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Tab: Vendas */}
      {activeTab === "vendas" && (
        <div className="space-y-3">
          {vendas.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              Nenhuma venda registrada para este produto.
            </p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Data
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                      Preço
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                      Frete
                    </th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">
                      No Prazo
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {vendas.slice(0, 50).map((v, idx) => (
                    <tr
                      key={`${v.id_pedido}-${v.id_item}`}
                      className={idx % 2 === 0 ? "" : "bg-muted/20"}
                    >
                      <td className="px-4 py-3">
                        {formatDate(v.pedido_compra_timestamp)}
                      </td>
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
                      <td className="px-4 py-3 text-right">
                        {formatCurrency(v.preco_BRL)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatCurrency(v.preco_frete)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {v.entrega_no_prazo === "Sim" ? (
                          <span className="text-green-600">Sim</span>
                        ) : v.entrega_no_prazo === "Não" || v.entrega_no_prazo === "Não Entregue" ? (
                          <span className="text-red-600">{v.entrega_no_prazo}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {vendas.length > 50 && (
                <div className="px-4 py-3 text-xs text-muted-foreground border-t bg-muted/20">
                  Exibindo 50 de {vendas.length} vendas
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <Separator className="my-6" />
      <div className="text-xs text-muted-foreground">
        {vendaStats && (
          <div className="flex gap-6 flex-wrap">
            <span>
              Ticket médio:{" "}
              {vendaStats.ticket_medio != null
                ? formatCurrency(vendaStats.ticket_medio)
                : "—"}
            </span>
            <span>
              Frete médio:{" "}
              {vendaStats.frete_medio != null
                ? formatCurrency(vendaStats.frete_medio)
                : "—"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
