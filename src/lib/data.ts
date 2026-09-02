import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import type { Contact, ExtraCost, Item, ItemEvent, Sale, Trade } from "./briquepro";
import { ACTIVE_STATUS, itemFinance, num } from "./briquepro";

export interface Workspace {
  items: Item[];
  costs: ExtraCost[];
  sales: Sale[];
  trades: Trade[];
  contacts: Contact[];
  events: ItemEvent[];
}

async function fetchWorkspace(): Promise<Workspace> {
  const [items, costs, sales, trades, contacts, events] = await Promise.all([
    supabase.from("items").select("*").order("created_at", { ascending: false }),
    supabase.from("extra_costs").select("*").order("spent_at", { ascending: false }),
    supabase.from("sales").select("*").order("sold_at", { ascending: false }),
    supabase.from("trades").select("*").order("traded_at", { ascending: false }),
    supabase.from("contacts").select("*").order("name"),
    supabase.from("item_events").select("*").order("happened_at", { ascending: false }),
  ]);

  const failure = [items, costs, sales, trades, contacts, events].find((r) => r.error);
  if (failure?.error) throw failure.error;

  return {
    items: items.data ?? [],
    costs: costs.data ?? [],
    sales: sales.data ?? [],
    trades: trades.data ?? [],
    contacts: contacts.data ?? [],
    events: events.data ?? [],
  };
}

export const workspaceKey = ["workspace"] as const;

export function useWorkspace() {
  return useQuery({ queryKey: workspaceKey, queryFn: fetchWorkspace });
}

export function useRefresh() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: workspaceKey });
}

/** Mutação genérica com invalidação e feedback. */
export function useAction<TVars>(
  fn: (vars: TVars) => Promise<unknown>,
  successMessage: string,
  onDone?: () => void,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: workspaceKey });
      toast.success(successMessage);
      onDone?.();
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Erro inesperado";
      toast.error(message);
    },
  });
}

export function saleByItem(ws: Workspace) {
  const map = new Map<string, Sale>();
  for (const sale of ws.sales) if (!map.has(sale.item_id)) map.set(sale.item_id, sale);
  return map;
}

export interface Overview {
  stockValue: number;
  invested: number;
  potentialProfit: number;
  accumulatedProfit: number;
  biggestProfit: number;
  biggestLoss: number;
  counts: Record<string, number>;
  salesCount: number;
  tradesCount: number;
  activeCount: number;
}

export function buildOverview(ws: Workspace): Overview {
  const sales = saleByItem(ws);
  let stockValue = 0;
  let invested = 0;
  let potentialProfit = 0;
  let accumulatedProfit = 0;
  let biggestProfit = 0;
  let biggestLoss = 0;
  const counts: Record<string, number> = {};

  for (const item of ws.items) {
    counts[item.status] = (counts[item.status] ?? 0) + 1;
    const finance = itemFinance(item, ws.costs, sales.get(item.id));
    if (ACTIVE_STATUS.includes(item.status)) {
      stockValue += num(item.estimated_value);
      invested += finance.totalCost;
      potentialProfit += finance.potentialProfit;
    }
    if (finance.profit !== null) {
      accumulatedProfit += finance.profit;
      biggestProfit = Math.max(biggestProfit, finance.profit);
      biggestLoss = Math.min(biggestLoss, finance.profit);
    }
  }

  const tradeCash = ws.trades.reduce(
    (acc, t) => acc + num(t.cash_received) - num(t.cash_paid),
    0,
  );

  return {
    stockValue,
    invested,
    potentialProfit,
    accumulatedProfit: accumulatedProfit + tradeCash,
    biggestProfit,
    biggestLoss,
    counts,
    salesCount: ws.sales.length,
    tradesCount: ws.trades.length,
    activeCount: ws.items.filter((i) => ACTIVE_STATUS.includes(i.status)).length,
  };
}

/** Árvore do brique: origem → troca → item recebido → venda. */
export function tradeChain(ws: Workspace, itemId: string): Item[] {
  const byId = new Map(ws.items.map((i) => [i.id, i]));
  const chain: Item[] = [];
  let current = byId.get(itemId);
  const guard = new Set<string>();
  while (current && !guard.has(current.id)) {
    guard.add(current.id);
    chain.unshift(current);
    current = current.parent_item_id ? byId.get(current.parent_item_id) : undefined;
  }
  // descendentes
  let tail = chain[chain.length - 1];
  while (tail) {
    const child = ws.items.find((i) => i.parent_item_id === tail!.id && !guard.has(i.id));
    if (!child) break;
    guard.add(child.id);
    chain.push(child);
    tail = child;
  }
  return chain;
}
