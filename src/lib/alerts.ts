import type { ExtraCost, Item, ItemEvent, Sale } from "./briquepro";
import { itemFinance, num } from "./briquepro";

export type AlertTone = "warn" | "danger";

export interface ItemAlert {
  code: "parado" | "custo_alto" | "margem_baixa" | "sem_atualizacao" | "manutencao_longa";
  label: string;
  detail: string;
  tone: AlertTone;
}

export const ALERT_LABEL: Record<ItemAlert["code"], string> = {
  parado: "Parado",
  custo_alto: "Custo alto",
  margem_baixa: "Margem baixa",
  sem_atualizacao: "Sem atualização",
  manutencao_longa: "Manutenção longa",
};

/** Limites usados nos alertas — ajustáveis num único lugar. */
export const ALERT_RULES = {
  stalledDays: 30,
  noUpdateDays: 21,
  maintenanceDays: 15,
  /** custo total acima desta fração do valor estimado = risco */
  costRatio: 0.85,
  /** margem mínima aceitável para item anunciado (%) */
  minMarginPct: 10,
};

export function daysSince(value: string | null | undefined): number | null {
  if (!value) return null;
  const then = new Date(value).getTime();
  if (!Number.isFinite(then)) return null;
  return Math.floor((Date.now() - then) / 86_400_000);
}

const OPEN_STATUS = ["em_negociacao", "em_estoque", "em_manutencao", "anunciado", "reservado"];

export function itemAlerts(
  item: Item,
  costs: ExtraCost[],
  events: ItemEvent[],
  sale?: Sale | null,
): ItemAlert[] {
  if (sale || !OPEN_STATUS.includes(item.status)) return [];

  const alerts: ItemAlert[] = [];
  const finance = itemFinance(item, costs, null);
  const estimated = num(item.estimated_value);

  const ageDays = daysSince(item.acquired_at ?? item.created_at);
  if (ageDays !== null && ageDays >= ALERT_RULES.stalledDays) {
    alerts.push({
      code: "parado",
      label: ALERT_LABEL.parado,
      detail: `${ageDays} dias em estoque`,
      tone: ageDays >= ALERT_RULES.stalledDays * 2 ? "danger" : "warn",
    });
  }

  if (estimated > 0 && finance.totalCost >= estimated * ALERT_RULES.costRatio) {
    alerts.push({
      code: "custo_alto",
      label: ALERT_LABEL.custo_alto,
      detail: "custo perto (ou acima) do valor estimado",
      tone: finance.totalCost >= estimated ? "danger" : "warn",
    });
  }

  if (item.status === "anunciado" && finance.potentialMargin < ALERT_RULES.minMarginPct) {
    alerts.push({
      code: "margem_baixa",
      label: ALERT_LABEL.margem_baixa,
      detail: `margem potencial de ${finance.potentialMargin.toFixed(1)}%`,
      tone: finance.potentialMargin < 0 ? "danger" : "warn",
    });
  }

  const lastEvent = events
    .filter((e) => e.item_id === item.id)
    .map((e) => e.happened_at)
    .sort()
    .at(-1);
  const idleDays = daysSince(lastEvent ?? item.updated_at);
  if (idleDays !== null && idleDays >= ALERT_RULES.noUpdateDays) {
    alerts.push({
      code: "sem_atualizacao",
      label: ALERT_LABEL.sem_atualizacao,
      detail: `${idleDays} dias sem movimentação`,
      tone: "warn",
    });
  }

  if (item.status === "em_manutencao") {
    const maintDays = daysSince(item.updated_at);
    if (maintDays !== null && maintDays >= ALERT_RULES.maintenanceDays) {
      alerts.push({
        code: "manutencao_longa",
        label: ALERT_LABEL.manutencao_longa,
        detail: `${maintDays} dias em manutenção`,
        tone: "warn",
      });
    }
  }

  return alerts;
}

export interface AlertBuckets {
  byItem: Map<string, ItemAlert[]>;
  total: number;
  byCode: Record<ItemAlert["code"], number>;
}

export function buildAlerts(ws: {
  items: Item[];
  costs: ExtraCost[];
  events: ItemEvent[];
  sales: Sale[];
}): AlertBuckets {
  const soldIds = new Set(ws.sales.map((s) => s.item_id));
  const byItem = new Map<string, ItemAlert[]>();
  const byCode: Record<ItemAlert["code"], number> = {
    parado: 0,
    custo_alto: 0,
    margem_baixa: 0,
    sem_atualizacao: 0,
    manutencao_longa: 0,
  };
  let total = 0;

  for (const item of ws.items) {
    const alerts = itemAlerts(item, ws.costs, ws.events, soldIds.has(item.id) ? ({} as Sale) : null);
    if (alerts.length) {
      byItem.set(item.id, alerts);
      total += alerts.length;
      for (const a of alerts) byCode[a.code] += 1;
    }
  }

  return { byItem, total, byCode };
}
