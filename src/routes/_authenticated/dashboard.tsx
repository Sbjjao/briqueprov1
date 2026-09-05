import { createFileRoute, Link } from "@tanstack/react-router";

import { EmptyState, Kpi, Money, Panel, Percent, StatusBadge, PageHeader } from "@/components/briq/primitives";
import {
  ACTIVE_STATUS,
  CATEGORY_LABEL,
  EVENT_LABEL,
  STATUS_LABEL,
  brl,
  dateTimeBR,
  itemFinance,
  num,
} from "@/lib/briquepro";
import { buildOverview, saleByItem, useWorkspace } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — BriquePro" },
      {
        name: "description",
        content: "Patrimônio em estoque, lucro potencial e resultado acumulado das suas negociações.",
      },
      { property: "og:title", content: "Dashboard do BriquePro" },
      { property: "og:description", content: "Visão financeira completa da sua operação de brique." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data, isLoading } = useWorkspace();

  if (isLoading || !data) return <p className="num text-[12px] text-faint">carregando…</p>;

  const overview = buildOverview(data);
  const sales = saleByItem(data);
  const rows = data.items.slice(0, 8);
  const events = data.events.slice(0, 6);
  const itemName = (id: string) => data.items.find((i) => i.id === id)?.name ?? "item";

  return (
    <>
      <PageHeader
        title="Dashboard geral"
        subtitle={`${data.items.length} itens · ${overview.salesCount} vendas · ${overview.tradesCount} trocas`}
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Patrimônio em estoque"
          value={brl(overview.stockValue)}
          hint={`${overview.activeUnits} unidades · ${overview.activeCount} cadastros`}
        />
        <Kpi
          label="Dinheiro investido"
          value={brl(overview.invested)}
          hint="compra + custos extras"
        />
        <Kpi
          label="Lucro potencial"
          value={brl(overview.potentialProfit)}
          tone="accent"
          hint="estimado − custo total"
        />
        <Kpi
          label="Lucro acumulado"
          value={brl(overview.accumulatedProfit)}
          tone={overview.accumulatedProfit < 0 ? "danger" : "default"}
          hint={`${overview.salesCount} vendas · ${overview.tradesCount} trocas`}
        />
      </section>

      <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {ACTIVE_STATUS.map((status) => (
          <div key={status} className="rounded-lg border border-line bg-panel p-3">
            <p className="label-mono">{STATUS_LABEL[status]}</p>
            <p className="num mt-1 text-xl">{overview.unitsByStatus[status] ?? 0}</p>
            <p className="num text-[10px] text-faint">
              {overview.counts[status] ?? 0} cadastros
            </p>
          </div>
        ))}
        <div className="rounded-lg border border-line bg-panel p-3">
          <p className="label-mono">Vendidos</p>
          <p className="num mt-1 text-xl text-accent">{overview.unitsByStatus["vendido"] ?? 0}</p>
          <p className="num text-[10px] text-faint">{overview.counts["vendido"] ?? 0} cadastros</p>
        </div>

      </section>

      <div className="grid gap-3 xl:grid-cols-3">
        <Panel
          title="Itens e negociação"
          count={data.items.length}
          className="xl:col-span-2"
          actions={
            <Link to="/itens" search={{ q: "", novo: false }} className="num text-[11px] text-accent">
              ver todos →
            </Link>
          }
        >
          {rows.length === 0 ? (
            <EmptyState title="Nenhum item cadastrado" hint="comece cadastrando sua primeira compra" />
          ) : (
            <>
              <div className="label-mono grid grid-cols-12 border-b border-line px-4 py-2">
                <span className="col-span-4">Item</span>
                <span className="col-span-2">Status</span>
                <span className="col-span-2">Custo / Valor</span>
                <span className="col-span-2 text-right">Lucro</span>
                <span className="col-span-2 text-right">Margem</span>
              </div>
              <div className="divide-y divide-line">
                {rows.map((item) => {
                  const f = itemFinance(item, data.costs, sales.get(item.id));
                  return (
                    <Link
                      key={item.id}
                      to="/itens/$id"
                      params={{ id: item.id }}
                      className="grid grid-cols-12 items-center px-4 py-3 hover:bg-panel2"
                    >
                      <div className="col-span-4 min-w-0">
                        <p className="truncate text-[13px] font-medium">
                          {item.name}
                          <span className="num ml-2 rounded border border-line px-1.5 py-0.5 text-[10px] text-faint">
                            {Math.max(1, num(item.quantity) || 1)} un.
                          </span>
                        </p>
                        <p className="num truncate text-[10px] text-faint">
                          {CATEGORY_LABEL[item.category]}
                          {item.serial ? ` · ${item.serial}` : ""}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <StatusBadge status={item.status} />
                      </div>
                      <div className="col-span-2">
                        <span className="num text-[12px]">{brl(f.totalCost)}</span>
                        <span className="num text-[10px] text-faint">
                          {" "}
                          / {brl(num(item.estimated_value))}
                        </span>
                      </div>
                      <div className="col-span-2 text-right">
                        <Money value={f.profit ?? f.potentialProfit} signed />
                      </div>
                      <div className="col-span-2 text-right">
                        <Percent value={f.margin ?? f.potentialMargin} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </Panel>

        <Panel title="Últimos eventos">
          {events.length === 0 ? (
            <EmptyState title="Sem histórico ainda" />
          ) : (
            <div className="space-y-0 p-4">
              {events.map((event, index) => (
                <div key={event.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className="mt-1 size-2 rounded-full bg-accent" />
                    {index < events.length - 1 && <span className="w-px flex-1 bg-line" />}
                  </div>
                  <div className="pb-4">
                    <p className="text-[12px] font-medium">
                      {EVENT_LABEL[event.kind]} · {itemName(event.item_id)}
                    </p>
                    <p className="num text-[10px] text-faint">
                      {dateTimeBR(event.happened_at)}
                      {event.amount !== null ? ` · ${brl(num(event.amount))}` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Kpi label="Maior lucro" value={brl(overview.biggestProfit)} tone="accent" />
        <Kpi
          label="Maior prejuízo"
          value={brl(overview.biggestLoss)}
          tone={overview.biggestLoss < 0 ? "danger" : "default"}
        />
        <Kpi
          label="Margem média potencial"
          value={
            overview.invested > 0
              ? `${((overview.potentialProfit / overview.invested) * 100).toFixed(1)}%`
              : "0%"
          }
        />
      </div>
    </>
  );
}
