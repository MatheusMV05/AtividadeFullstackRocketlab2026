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

const CATEGORY_COLOR_MAP: Record<string, string> = {
  // Eletrônicos / Info / Áudio
  eletronicos: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  informatica_acessorios: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  tablets_impressao_imagem: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  telefonia: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  telefonia_fixa: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  audio: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  cine_foto: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  eletroportateis: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  eletrodomesticos: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  eletrodomesticos_2: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  // Games / PCs
  consoles_games: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  pc_gamer: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  pcs: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  // Fashion
  fashion_bolsas_e_acessorios: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  fashion_calcados: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  fashion_roupa_feminina: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  fashion_roupa_masculina: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  fashion_roupa_infanto_juvenil: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  fashion_esporte: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  fashion_underwear_e_moda_praia: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  malas_acessorios: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  // Casa / Móveis / Banho
  cama_mesa_banho: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  moveis_colchao_e_estofado: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  moveis_cozinha_area_de_servico_jantar_e_jardim: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  moveis_decoracao: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  moveis_escritorio: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  moveis_quarto: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  moveis_sala: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  casa_conforto: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  casa_conforto_2: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  casa_construcao: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  utilidades_domesticas: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  // Alimentos / Bebidas
  alimentos: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  alimentos_bebidas: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  bebidas: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  la_cuisine: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  portateis_casa_forno_e_cafe: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  portateis_cozinha_e_preparadores_de_alimentos: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  // Esporte
  esporte_lazer: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  // Beleza / Perfumaria
  beleza_saude: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
  perfumaria: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
  fraldas_higiene: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
  // Livros / Mídia
  livros_interesse_geral: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  livros_tecnicos: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  livros_importados: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  cds_dvds_musicais: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  dvds_blu_ray: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  musica: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  instrumentos_musicais: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  // Automotivo / Construção / Ferramentas
  automotivo: "bg-stone-100 text-stone-800 dark:bg-stone-900/30 dark:text-stone-300",
  construcao_ferramentas_construcao: "bg-stone-100 text-stone-800 dark:bg-stone-900/30 dark:text-stone-300",
  construcao_ferramentas_ferramentas: "bg-stone-100 text-stone-800 dark:bg-stone-900/30 dark:text-stone-300",
  construcao_ferramentas_iluminacao: "bg-stone-100 text-stone-800 dark:bg-stone-900/30 dark:text-stone-300",
  construcao_ferramentas_jardim: "bg-stone-100 text-stone-800 dark:bg-stone-900/30 dark:text-stone-300",
  construcao_ferramentas_seguranca: "bg-stone-100 text-stone-800 dark:bg-stone-900/30 dark:text-stone-300",
  ferramentas_jardim: "bg-stone-100 text-stone-800 dark:bg-stone-900/30 dark:text-stone-300",
  flores: "bg-stone-100 text-stone-800 dark:bg-stone-900/30 dark:text-stone-300",
  // Bebês / Brinquedos
  bebes: "bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-300",
  brinquedos: "bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-300",
  // Arte / Papelaria
  artes: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  artes_e_artesanato: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  papelaria: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
};

export function getCategoriaColor(categoria: string): string {
  return CATEGORY_COLOR_MAP[categoria] ?? "bg-secondary text-secondary-foreground";
}
