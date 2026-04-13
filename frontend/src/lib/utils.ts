import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CATEGORIA_LABELS: Record<string, string> = {
  agro_industria_e_comercio: "Agro, Indústria e Comércio",
  alimentos: "Alimentos",
  alimentos_bebidas: "Alimentos e Bebidas",
  artes: "Artes",
  artes_e_artesanato: "Artes e Artesanato",
  artigos_de_festas: "Artigos de Festas",
  artigos_de_natal: "Artigos de Natal",
  audio: "Áudio",
  automotivo: "Automotivo",
  bebes: "Bebês",
  bebidas: "Bebidas",
  beleza_saude: "Beleza e Saúde",
  brinquedos: "Brinquedos",
  cama_mesa_banho: "Cama, Mesa e Banho",
  casa_conforto: "Casa e Conforto",
  casa_conforto_2: "Casa e Conforto 2",
  casa_construcao: "Casa e Construção",
  cds_dvds_musicais: "CDs e DVDs Musicais",
  cine_foto: "Cine e Foto",
  climatizacao: "Climatização",
  consoles_games: "Consoles e Games",
  construcao_ferramentas_construcao: "Construção - Ferramentas",
  construcao_ferramentas_ferramentas: "Ferramentas",
  construcao_ferramentas_iluminacao: "Iluminação",
  construcao_ferramentas_jardim: "Jardim",
  construcao_ferramentas_seguranca: "Segurança",
  cool_stuff: "Cool Stuff",
  dvds_blu_ray: "DVDs e Blu-ray",
  eletrodomesticos: "Eletrodomésticos",
  eletrodomesticos_2: "Eletrodomésticos 2",
  eletronicos: "Eletrônicos",
  eletroportateis: "Eletroportáteis",
  esporte_lazer: "Esporte e Lazer",
  fashion_bolsas_e_acessorios: "Bolsas e Acessórios",
  fashion_calcados: "Calçados",
  fashion_esporte: "Moda Esportiva",
  fashion_roupa_feminina: "Moda Feminina",
  fashion_roupa_infanto_juvenil: "Moda Infantojuvenil",
  fashion_roupa_masculina: "Moda Masculina",
  fashion_underwear_e_moda_praia: "Underwear e Moda Praia",
  ferramentas_jardim: "Ferramentas de Jardim",
  flores: "Flores",
  fraldas_higiene: "Fraldas e Higiene",
  industria_comercio_e_negocios: "Indústria, Comércio e Negócios",
  informatica_acessorios: "Informática e Acessórios",
  instrumentos_musicais: "Instrumentos Musicais",
  la_cuisine: "La Cuisine",
  livros_importados: "Livros Importados",
  livros_interesse_geral: "Livros - Interesse Geral",
  livros_tecnicos: "Livros Técnicos",
  malas_acessorios: "Malas e Acessórios",
  market_place: "Marketplace",
  moveis_colchao_e_estofado: "Móveis, Colchão e Estofado",
  moveis_cozinha_area_de_servico_jantar_e_jardim: "Móveis - Cozinha, Área de Serviço, Jantar e Jardim",
  moveis_decoracao: "Móveis e Decoração",
  moveis_escritorio: "Móveis de Escritório",
  moveis_quarto: "Móveis de Quarto",
  moveis_sala: "Móveis de Sala",
  musica: "Música",
  papelaria: "Papelaria",
  pc_gamer: "PC Gamer",
  pcs: "PCs",
  perfumaria: "Perfumaria",
  pet_shop: "Pet Shop",
  portateis_casa_forno_e_cafe: "Portáteis - Casa, Forno e Café",
  portateis_cozinha_e_preparadores_de_alimentos: "Portáteis - Cozinha e Preparadores de Alimentos",
  relogios_presentes: "Relógios e Presentes",
  seguros_e_servicos: "Seguros e Serviços",
  sinalizacao_e_seguranca: "Sinalização e Segurança",
  tablets_impressao_imagem: "Tablets, Impressão e Imagem",
  telefonia: "Telefonia",
  telefonia_fixa: "Telefonia Fixa",
  utilidades_domesticas: "Utilidades Domésticas",
};

/** Converte slug de categoria para texto legível em português. */
export function formatCategoria(categoria: string): string {
  return (
    CATEGORIA_LABELS[categoria] ??
    categoria
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );
}

/**
 * Remove artefatos de escaping CSV do nome do produto.
 * Ex.: `"Monitor 24"" Amarelo"` → `Monitor 24" Amarelo`
 */
export function formatNomeProduto(nome: string): string {
  let n = nome.trim();
  if (n.startsWith('"') && n.endsWith('"')) {
    n = n.slice(1, -1);
  }
  return n.replace(/""/g, '"').replace(/"/g, "");
}
