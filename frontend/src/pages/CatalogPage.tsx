import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Plus, Package } from "lucide-react";
import { api } from "@/lib/api";
import { formatCategoria, formatNomeProduto } from "@/lib/utils";
import type { Produto } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PAGE_SIZE = 20;

export default function CatalogPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [buscaInput, setBuscaInput] = useState(
    searchParams.get("busca") ?? ""
  );

  const page = Number(searchParams.get("page") ?? "1");
  const busca = searchParams.get("busca") ?? "";
  const categoria = searchParams.get("categoria") ?? "";

  const fetchProdutos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getProdutos({
        page,
        page_size: PAGE_SIZE,
        busca: busca || undefined,
        categoria: categoria || undefined,
      });
      setProdutos(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } finally {
      setLoading(false);
    }
  }, [page, busca, categoria]);

  useEffect(() => {
    fetchProdutos();
  }, [fetchProdutos]);

  useEffect(() => {
    api.getCategorias().then((cats) => setCategorias(cats.filter((c) => c.trim() !== "")));
  }, []);

  function handleBusca(e: React.FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (buscaInput) next.set("busca", buscaInput);
    else next.delete("busca");
    next.set("page", "1");
    setSearchParams(next);
  }

  function handleCategoria(value: string) {
    const next = new URLSearchParams(searchParams);
    if (value && value !== "__all__") next.set("categoria", value);
    else next.delete("categoria");
    next.set("page", "1");
    setSearchParams(next);
  }

  function handlePage(newPage: number) {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(newPage));
    setSearchParams(next);
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Catálogo de Produtos
          </h1>
          <p className="text-muted-foreground mt-1">
            {total} produto{total !== 1 ? "s" : ""} encontrado
            {total !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => navigate("/produtos/novo")}>
          <Plus className="h-4 w-4" />
          Novo Produto
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <form onSubmit={handleBusca} className="flex gap-2 flex-1 min-w-64">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou categoria..."
              value={buscaInput}
              onChange={(e) => setBuscaInput(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary">
            Buscar
          </Button>
        </form>

        <Select
          value={categoria || "__all__"}
          onValueChange={handleCategoria}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Todas as categorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todas as categorias</SelectItem>
            {categorias.map((c) => (
              <SelectItem key={c} value={c}>
                {formatCategoria(c)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grade de produtos */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-44 rounded-lg bg-muted animate-pulse"
            />
          ))}
        </div>
      ) : produtos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <Package className="h-12 w-12 mb-4" />
          <p className="text-lg font-medium">Nenhum produto encontrado</p>
          <p className="text-sm">Tente ajustar os filtros de busca</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {produtos.map((produto) => (
            <Card
              key={produto.id_produto}
              className="cursor-pointer hover:shadow-md transition-shadow hover:border-primary/50"
              onClick={() => navigate(`/produtos/${produto.id_produto}`)}
            >
              <CardHeader className="pb-2">
                <Badge variant="secondary" className="w-fit text-xs mb-1">
                  {formatCategoria(produto.categoria_produto)}
                </Badge>
                <CardTitle className="text-base leading-tight line-clamp-2">
                  {formatNomeProduto(produto.nome_produto)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-xs space-y-1">
                  {produto.peso_produto_gramas != null && (
                    <div>Peso: {produto.peso_produto_gramas}g</div>
                  )}
                  {produto.comprimento_centimetros != null && (
                    <div>
                      Dimensões: {produto.comprimento_centimetros} ×{" "}
                      {produto.largura_centimetros} ×{" "}
                      {produto.altura_centimetros} cm
                    </div>
                  )}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => handlePage(page - 1)}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground px-2">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => handlePage(page + 1)}
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  );
}
