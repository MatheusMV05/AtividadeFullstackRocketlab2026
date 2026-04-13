import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Plus, Package, LayoutGrid, List } from "lucide-react";
import { motion } from "framer-motion";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import { api } from "@/lib/api";
import { formatCategoria, formatNomeProduto, getCategoriaColor } from "@/lib/utils";
import type { Produto } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { toast } from "@/hooks/use-toast";

const PAGE_SIZE = 20;

export default function CatalogPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [buscaInput, setBuscaInput] = useState(searchParams.get("busca") ?? "");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [editingCell, setEditingCell] = useState<{ id: string; value: string } | null>(null);

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

  // Debounced live search — fires 400ms after the user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      if (buscaInput.trim()) next.set("busca", buscaInput.trim());
      else next.delete("busca");
      next.set("page", "1");
      setSearchParams(next);
    }, 400);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buscaInput]);

  async function handleInlineEditSave(id: string, newCategoria: string) {
    setEditingCell(null);
    if (!newCategoria) return;
    try {
      await api.atualizarProduto(id, { categoria_produto: newCategoria });
      setProdutos((prev) =>
        prev.map((p) => (p.id_produto === id ? { ...p, categoria_produto: newCategoria } : p))
      );
      toast({ title: "Categoria atualizada" });
    } catch {
      toast({ title: "Erro ao atualizar categoria", variant: "destructive" });
    }
  }

  const columns = useMemo<ColumnDef<Produto>[]>(
    () => [
      {
        accessorKey: "nome_produto",
        header: "Nome",
        cell: ({ row }) => (
          <span
            className="cursor-pointer hover:underline text-sm font-medium"
            onClick={() => navigate(`/produtos/${row.original.id_produto}`)}
          >
            {formatNomeProduto(row.original.nome_produto)}
          </span>
        ),
      },
      {
        accessorKey: "categoria_produto",
        header: "Categoria",
        cell: ({ row }) => {
          const produto = row.original;
          const isEditing = editingCell?.id === produto.id_produto;
          if (isEditing) {
            return (
              <select
                autoFocus
                defaultValue={editingCell.value}
                className="border rounded px-1 py-0.5 text-xs bg-background"
                onBlur={(e) => handleInlineEditSave(produto.id_produto, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter")
                    handleInlineEditSave(produto.id_produto, e.currentTarget.value);
                  if (e.key === "Escape") setEditingCell(null);
                }}
              >
                {categorias.map((c) => (
                  <option key={c} value={c}>
                    {formatCategoria(c)}
                  </option>
                ))}
              </select>
            );
          }
          return (
            <span
              className={`text-xs px-2 py-0.5 rounded-full cursor-pointer font-medium ${getCategoriaColor(produto.categoria_produto)}`}
              title="Clique para editar"
              onClick={() =>
                setEditingCell({ id: produto.id_produto, value: produto.categoria_produto })
              }
            >
              {formatCategoria(produto.categoria_produto)}
            </span>
          );
        },
      },
      {
        accessorKey: "peso_produto_gramas",
        header: "Peso",
        cell: ({ row }) => (
          <span className="tabular-nums text-sm text-muted-foreground">
            {row.original.peso_produto_gramas != null
              ? `${row.original.peso_produto_gramas} g`
              : "—"}
          </span>
        ),
      },
      {
        id: "dimensoes",
        header: "Dimensões",
        cell: ({ row }) => {
          const p = row.original;
          if (p.comprimento_centimetros == null)
            return <span className="text-muted-foreground text-sm">—</span>;
          return (
            <span className="tabular-nums text-xs text-muted-foreground">
              {p.comprimento_centimetros} × {p.largura_centimetros} × {p.altura_centimetros} cm
            </span>
          );
        },
      },
      {
        id: "acoes",
        header: "",
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={() => navigate(`/produtos/${row.original.id_produto}`)}
          >
            Ver
          </Button>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [categorias, editingCell, navigate]
  );

  const table = useReactTable({
    data: produtos,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

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
          <h1 className="text-3xl font-bold tracking-tight">Catálogo de Produtos</h1>
          <p className="text-muted-foreground mt-1">
            {total} produto{total !== 1 ? "s" : ""} encontrado{total !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle grade / tabela */}
          <div className="flex items-center gap-1 border rounded-md p-0.5">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewMode("grid")}
              aria-label="Visualização em grade"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewMode("table")}
              aria-label="Visualização em tabela"
            >
              <List className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Button onClick={() => navigate("/produtos/novo")}>
            <Plus className="h-4 w-4" />
            Novo Produto
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou categoria..."
            value={buscaInput}
            onChange={(e) => setBuscaInput(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={categoria || "__all__"} onValueChange={handleCategoria}>
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

      {/* Conteúdo */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-44 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : produtos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <Package className="h-12 w-12 mb-4" />
          <p className="text-lg font-medium">Nenhum produto encontrado</p>
          <p className="text-sm">Tente ajustar os filtros de busca</p>
        </div>
      ) : viewMode === "table" ? (
        /* Tabela TanStack */
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="bg-muted/50">
                  {hg.headers.map((h) => (
                    <th
                      key={h.id}
                      className="text-left px-4 py-3 font-medium text-muted-foreground"
                    >
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row, idx) => (
                <tr key={row.id} className={idx % 2 === 0 ? "" : "bg-muted/20"}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Grade com animação layout */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {produtos.map((produto) => (
            <motion.div
              key={produto.id_produto}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Card
                className="cursor-pointer hover:shadow-md transition-shadow hover:border-primary/50 h-full"
                onClick={() => navigate(`/produtos/${produto.id_produto}`)}
              >
                <CardHeader className="pb-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium w-fit mb-1 ${getCategoriaColor(produto.categoria_produto)}`}
                  >
                    {formatCategoria(produto.categoria_produto)}
                  </span>
                  <CardTitle className="text-base leading-tight line-clamp-2">
                    <motion.span layoutId={`product-title-${produto.id_produto}`}>
                      {formatNomeProduto(produto.nome_produto)}
                    </motion.span>
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
                        {produto.largura_centimetros} × {produto.altura_centimetros} cm
                      </div>
                    )}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
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
