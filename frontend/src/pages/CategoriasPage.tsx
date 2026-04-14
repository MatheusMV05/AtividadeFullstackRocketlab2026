import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpDown, Award, ImageOff, Medal, Package, Plus, Search, Star, ShoppingCart, Trophy, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { formatCategoria } from "@/lib/utils";
import type { CategoriaStats } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

type OrdenarPor = "receita" | "avaliacao" | "produtos" | "vendas";

const ORDENAR_LABELS: Record<OrdenarPor, string> = {
  receita: "Receita",
  avaliacao: "Avaliação",
  produtos: "Produtos",
  vendas: "Vendas",
};

function formatCurrency(value: number) {
  if (value >= 1_000_000) return `R$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `R$${(value / 1_000).toFixed(0)}k`;
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function RankBadge({ rank }: { rank: number }) {
  if (rank > 3) return null;
  const config = {
    1: { Icon: Trophy, color: "text-yellow-400", bg: "bg-yellow-400/20" },
    2: { Icon: Medal, color: "text-slate-300", bg: "bg-slate-300/20" },
    3: { Icon: Award, color: "text-amber-600", bg: "bg-amber-600/20" },
  }[rank]!;
  const { Icon, color, bg } = config;
  return (
    <span className={`absolute top-2 right-2 rounded-full p-1 ${bg} backdrop-blur-sm`}>
      <Icon className={`h-4 w-4 ${color}`} />
    </span>
  );
}

export default function CategoriasPage() {
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState<CategoriaStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordenar, setOrdenar] = useState<OrdenarPor>("receita");
  const [busca, setBusca] = useState("");
  const [dialogAberto, setDialogAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [novaCategoria, setNovaCategoria] = useState("");
  const [novaImagem, setNovaImagem] = useState("");
  const [previewOk, setPreviewOk] = useState(true);

  useEffect(() => {
    api.getCategoriasStats()
      .then(setCategorias)
      .finally(() => setLoading(false));
  }, []);

  const termo = busca.trim().toLowerCase();
  const filtradas = termo
    ? categorias.filter((c) =>
        formatCategoria(c.categoria).toLowerCase().includes(termo) ||
        c.categoria.toLowerCase().includes(termo)
      )
    : categorias;

  const ordenadas = [...filtradas].sort((a, b) => {
    if (ordenar === "receita") return b.receita_total - a.receita_total;
    if (ordenar === "avaliacao") return (b.media_avaliacao ?? 0) - (a.media_avaliacao ?? 0);
    if (ordenar === "produtos") return b.total_produtos - a.total_produtos;
    return b.total_vendas - a.total_vendas;
  });

  async function handleCriarCategoria() {
    const slug = novaCategoria.trim().toLowerCase().replace(/\s+/g, "_");
    if (!slug || !novaImagem.trim()) return;
    setSalvando(true);
    try {
      await api.criarCategoria({ categoria: slug, link_imagem: novaImagem.trim() });
      toast({ title: "Categoria criada com sucesso" });
      setDialogAberto(false);
      setNovaCategoria("");
      setNovaImagem("");
      setPreviewOk(true);
      const updated = await api.getCategoriasStats();
      setCategorias(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao criar categoria";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setSalvando(false);
    }
  }

  function handleDialogClose(open: boolean) {
    setDialogAberto(open);
    if (!open) {
      setNovaCategoria("");
      setNovaImagem("");
      setPreviewOk(true);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categorias</h1>
          <p className="text-muted-foreground mt-1">
            {termo
              ? `${ordenadas.length} de ${categorias.length} categoria${categorias.length !== 1 ? "s" : ""}`
              : `${categorias.length} categoria${categorias.length !== 1 ? "s" : ""} cadastrada${categorias.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Button onClick={() => setDialogAberto(true)}>
          <Plus className="h-4 w-4" />
          Nova Categoria
        </Button>
      </div>

      {/* Busca */}
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar categoria..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Ordenação */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <span className="text-sm text-muted-foreground flex items-center gap-1.5">
          <ArrowUpDown className="h-3.5 w-3.5" /> Ordenar por:
        </span>
        {(Object.keys(ORDENAR_LABELS) as OrdenarPor[]).map((key) => (
          <Button
            key={key}
            variant={ordenar === key ? "secondary" : "outline"}
            size="sm"
            onClick={() => setOrdenar(key)}
          >
            {ORDENAR_LABELS[key]}
          </Button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden border bg-card animate-pulse">
              <div className="h-36 bg-muted" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {ordenadas.map((cat, idx) => (
            <motion.div
              key={cat.categoria}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: Math.min(idx * 0.03, 0.4) }}
            >
              <div
                className="rounded-xl overflow-hidden border bg-card hover:shadow-md hover:border-primary/50 transition-all cursor-pointer group relative"
                onClick={() => navigate(`/categorias/${cat.categoria}`)}
              >
                {/* Banner com imagem */}
                <div className="relative h-36 bg-muted overflow-hidden">
                  {cat.link_imagem ? (
                    <img
                      src={cat.link_imagem}
                      alt={formatCategoria(cat.categoria)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                        const parent = (e.currentTarget as HTMLImageElement).parentElement;
                        if (parent) {
                          const fallback = parent.querySelector(".img-fallback") as HTMLElement | null;
                          if (fallback) fallback.style.display = "flex";
                        }
                      }}
                    />
                  ) : null}
                  <div
                    className="img-fallback absolute inset-0 flex items-center justify-center text-muted-foreground"
                    style={{ display: cat.link_imagem ? "none" : "flex" }}
                  >
                    <ImageOff className="h-10 w-10 opacity-40" />
                  </div>
                  {/* Gradiente para legibilidade */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <RankBadge rank={idx + 1} />
                </div>

                {/* Conteúdo */}
                <div className="p-4">
                  <h3 className="font-semibold text-sm leading-tight mb-3 line-clamp-1">
                    {formatCategoria(cat.categoria)}
                  </h3>

                  <div className="grid grid-cols-2 gap-y-2 gap-x-3 text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Package className="h-3.5 w-3.5 shrink-0" />
                      <span className="tabular-nums font-medium text-foreground">
                        {cat.total_produtos.toLocaleString("pt-BR")}
                      </span>
                      <span>produtos</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <ShoppingCart className="h-3.5 w-3.5 shrink-0" />
                      <span className="tabular-nums font-medium text-foreground">
                        {cat.total_vendas.toLocaleString("pt-BR")}
                      </span>
                      <span>vendas</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                      <span className="tabular-nums font-medium text-foreground">
                        {formatCurrency(cat.receita_total)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Star className="h-3.5 w-3.5 shrink-0" />
                      <span className="tabular-nums font-medium text-foreground">
                        {cat.media_avaliacao != null ? cat.media_avaliacao.toFixed(1) : "—"}
                      </span>
                      <span>/ 5</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Dialog — Nova Categoria */}
      <Dialog open={dialogAberto} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Categoria</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="categoria-nome">Nome</Label>
              <Input
                id="categoria-nome"
                placeholder="ex: eletronicos, moda_feminina"
                value={novaCategoria}
                onChange={(e) => setNovaCategoria(e.target.value)}
              />
              {novaCategoria.trim() && (
                <p className="text-xs text-muted-foreground">
                  Slug:{" "}
                  <span className="font-mono text-foreground">
                    {novaCategoria.trim().toLowerCase().replace(/\s+/g, "_")}
                  </span>
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="categoria-imagem">URL da Imagem</Label>
              <Input
                id="categoria-imagem"
                placeholder="https://..."
                value={novaImagem}
                onChange={(e) => {
                  setNovaImagem(e.target.value);
                  setPreviewOk(true);
                }}
              />
            </div>

            {/* Preview da imagem — apenas informativo */}
            {novaImagem.trim() && (
              <div className="rounded-lg overflow-hidden border h-40 bg-muted relative">
                {previewOk ? (
                  <img
                    src={novaImagem.trim()}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={() => setPreviewOk(false)}
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-muted-foreground">
                    <ImageOff className="h-6 w-6" />
                    <span className="text-xs">Prévia não disponível</span>
                    <span className="text-xs opacity-60">A URL será salva mesmo assim</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleDialogClose(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCriarCategoria}
              disabled={salvando || !novaCategoria.trim() || !novaImagem.trim()}
            >
              {salvando ? "Salvando..." : "Criar Categoria"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
