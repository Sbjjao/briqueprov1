import type { Tables, Enums } from "@/integrations/supabase/types";

export type Item = Tables<"items">;
export type ExtraCost = Tables<"extra_costs">;
export type Sale = Tables<"sales">;
export type Trade = Tables<"trades">;
export type Contact = Tables<"contacts">;
export type ItemEvent = Tables<"item_events">;
export type ItemStatus = Enums<"item_status">;
export type ItemCategory = Enums<"item_category">;
export type CostKind = Enums<"cost_kind">;
export type EventKind = Enums<"event_kind">;

export const STATUS_LABEL: Record<ItemStatus, string> = {
  em_negociacao: "Em negociação",
  em_estoque: "Em estoque",
  em_manutencao: "Em manutenção",
  anunciado: "Anunciado",
  reservado: "Reservado",
  trocado: "Trocado",
  vendido: "Vendido",
  cancelado: "Cancelado / prejuízo",
};

export const STATUS_LIST = Object.keys(STATUS_LABEL) as ItemStatus[];

export const CATEGORY_LABEL: Record<ItemCategory, string> = {
  eletronicos: "Eletrônicos",
  carros_pecas: "Carros / peças",
  games: "Games",
  celulares: "Celulares",
  informatica: "Informática",
  colecionaveis: "Colecionáveis",
  outros: "Outros",
};

export const CATEGORY_LIST = Object.keys(CATEGORY_LABEL) as ItemCategory[];

export const COST_LABEL: Record<CostKind, string> = {
  frete: "Frete",
  manutencao: "Manutenção",
  pecas: "Peças",
  taxas: "Taxas",
  outros: "Outros",
};

export const COST_LIST = Object.keys(COST_LABEL) as CostKind[];

export const EVENT_LABEL: Record<EventKind, string> = {
  compra: "Compra",
  gasto: "Gasto adicional",
  anuncio: "Anúncio publicado",
  proposta: "Proposta recebida",
  troca: "Troca realizada",
  venda: "Venda final",
  nota: "Anotação",
};

/** Status que ainda representam capital parado no estoque. */
export const ACTIVE_STATUS: ItemStatus[] = [
  "em_negociacao",
  "em_estoque",
  "em_manutencao",
  "anunciado",
  "reservado",
];

export const num = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const brl = (value: number): string =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(num(value));

export const pct = (value: number): string =>
  `${num(value).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

export const dateBR = (value: string | null | undefined): string =>
  value ? new Date(value).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "—";

export const dateTimeBR = (value: string | null | undefined): string =>
  value
    ? new Date(value).toLocaleString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

/* ------------------------------------------------------------------ */
/* Regras de cálculo                                                   */
/* ------------------------------------------------------------------ */

export interface ItemFinance {
  extraCost: number;
  /** custo total = compra + frete + manutenção + peças + taxas + outros */
  totalCost: number;
  /** valor líquido da venda = vendido − taxas − frete pago por você */
  netSale: number | null;
  /** lucro = líquido − custo total (realizado) */
  profit: number | null;
  /** margem = (lucro ÷ custo total) × 100 */
  margin: number | null;
  /** lucro potencial = estimado − custo total (para itens ainda em estoque) */
  potentialProfit: number;
  potentialMargin: number;
  sold: boolean;
}

export function itemFinance(item: Item, costs: ExtraCost[], sale?: Sale | null): ItemFinance {
  const extraCost = costs
    .filter((c) => c.item_id === item.id)
    .reduce((acc, c) => acc + num(c.amount), 0);
  const totalCost = num(item.purchase_value) + extraCost;
  const netSale = sale ? num(sale.sold_value) - num(sale.fees) - num(sale.shipping) : null;
  const profit = netSale === null ? null : netSale - totalCost;
  const margin = profit === null || totalCost === 0 ? null : (profit / totalCost) * 100;
  const potentialProfit = num(item.estimated_value) - totalCost;
  const potentialMargin = totalCost === 0 ? 0 : (potentialProfit / totalCost) * 100;
  return {
    extraCost,
    totalCost,
    netSale,
    profit,
    margin,
    potentialProfit,
    potentialMargin,
    sold: Boolean(sale),
  };
}

/** Calculadora "quanto preciso vender para valer a pena?" */
export function minimumSalePrice(input: {
  totalCost: number;
  desiredMarginPct: number;
  feesPct: number;
  shipping: number;
}) {
  const totalCost = num(input.totalCost);
  const target = totalCost * (1 + num(input.desiredMarginPct) / 100);
  const feeRate = Math.min(Math.max(num(input.feesPct), 0), 99) / 100;
  const price = (target + num(input.shipping)) / (1 - feeRate);
  const fees = price * feeRate;
  const net = price - fees - num(input.shipping);
  const profit = net - totalCost;
  return {
    price,
    fees,
    net,
    profit,
    margin: totalCost === 0 ? 0 : (profit / totalCost) * 100,
  };
}
