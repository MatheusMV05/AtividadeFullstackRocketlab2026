export interface Produto {
  id_produto: string;
  nome_produto: string;
  categoria_produto: string;
  peso_produto_gramas: number | null;
  comprimento_centimetros: number | null;
  altura_centimetros: number | null;
  largura_centimetros: number | null;
}

export interface ProdutoListResponse {
  items: Produto[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ProdutoCreate {
  nome_produto: string;
  categoria_produto: string;
  peso_produto_gramas?: number | null;
  comprimento_centimetros?: number | null;
  altura_centimetros?: number | null;
  largura_centimetros?: number | null;
}

export interface ProdutoUpdate {
  nome_produto?: string;
  categoria_produto?: string;
  peso_produto_gramas?: number | null;
  comprimento_centimetros?: number | null;
  altura_centimetros?: number | null;
  largura_centimetros?: number | null;
}

export interface AvaliacaoResponse {
  id_avaliacao: string;
  id_pedido: string;
  avaliacao: number;
  titulo_comentario: string | null;
  comentario: string | null;
  data_comentario: string | null;
  data_resposta: string | null;
}

export interface AvaliacaoStats {
  media_avaliacao: number | null;
  total_avaliacoes: number;
  distribuicao: Record<string, number>;
}

export interface VendaResponse {
  id_pedido: string;
  id_item: number;
  id_vendedor: string;
  preco_BRL: number;
  preco_frete: number;
  status: string;
  pedido_compra_timestamp: string | null;
  pedido_entregue_timestamp: string | null;
  entrega_no_prazo: string | null;
}

export interface VendaStats {
  total_vendas: number;
  receita_total: number;
  ticket_medio: number | null;
  frete_medio: number | null;
}
