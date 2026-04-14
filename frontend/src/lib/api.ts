import type {
  AvaliacaoResponse,
  AvaliacaoStats,
  CategoriaDashboard,
  CategoriaCreate,
  CategoriaStats,
  DashboardMesStats,
  DashboardStats,
  ReceitaDiariaItem,
  HealthScore,
  Produto,
  ProdutoCreate,
  ProdutoListResponse,
  ProdutoUpdate,
  VendaResponse,
  VendaStats,
  VendaTimelineEntry,
} from "@/types";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail ?? "Erro na requisição");
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  // Produtos
  getProdutos(params?: {
    page?: number;
    page_size?: number;
    busca?: string;
    categoria?: string;
  }): Promise<ProdutoListResponse> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.page_size) qs.set("page_size", String(params.page_size));
    if (params?.busca) qs.set("busca", params.busca);
    if (params?.categoria) qs.set("categoria", params.categoria);
    const q = qs.toString();
    return request(`/produtos${q ? `?${q}` : ""}`);
  },

  getCategorias(): Promise<string[]> {
    return request("/produtos/categorias");
  },

  getProduto(id: string): Promise<Produto> {
    return request(`/produtos/${id}`);
  },

  criarProduto(data: ProdutoCreate): Promise<Produto> {
    return request("/produtos", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  atualizarProduto(id: string, data: ProdutoUpdate): Promise<Produto> {
    return request(`/produtos/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  removerProduto(id: string): Promise<void> {
    return request(`/produtos/${id}`, { method: "DELETE" });
  },

  // Avaliações
  getAvaliacoes(idProduto: string): Promise<AvaliacaoResponse[]> {
    return request(`/produtos/${idProduto}/avaliacoes`);
  },

  getAvaliacaoStats(idProduto: string): Promise<AvaliacaoStats> {
    return request(`/produtos/${idProduto}/avaliacoes/stats`);
  },

  // Vendas
  getVendas(idProduto: string): Promise<VendaResponse[]> {
    return request(`/produtos/${idProduto}/vendas`);
  },

  getVendaStats(idProduto: string): Promise<VendaStats> {
    return request(`/produtos/${idProduto}/vendas/stats`);
  },

  getVendaTimeline(idProduto: string, days: number): Promise<VendaTimelineEntry[]> {
    return request(`/produtos/${idProduto}/vendas/timeline?days=${days}`);
  },

  getHealthScore(idProduto: string): Promise<HealthScore> {
    return request(`/produtos/${idProduto}/health-score`);
  },

  // Categorias
  getCategoriasStats(): Promise<CategoriaStats[]> {
    return request("/categorias/stats");
  },

  getCategoriaDashboard(categoria: string): Promise<CategoriaDashboard> {
    return request(`/categorias/${encodeURIComponent(categoria)}/dashboard`);
  },

  criarCategoria(data: CategoriaCreate): Promise<{ categoria: string; link_imagem: string }> {
    return request("/categorias", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getDashboardStats(): Promise<DashboardStats> {
    return request("/dashboard/stats");
  },

  getDashboardReceitaDiaria(ano: number, mes: number): Promise<ReceitaDiariaItem[]> {
    return request(`/dashboard/receita-diaria?ano=${ano}&mes=${mes}`);
  },

  getDashboardStatsMes(ano: number, mes: number): Promise<DashboardMesStats> {
    return request(`/dashboard/stats-mes?ano=${ano}&mes=${mes}`);
  },
};
