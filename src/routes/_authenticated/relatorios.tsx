import { createFileRoute, Link } from "@tanstack/react-router";

import { EmptyState, Kpi, Money, Panel, PageHeader } from "@/components/briq/primitives";
import { CATEGORY_LABEL, CATEGORY_LIST, EVENT_LABEL, brl, dateTimeBR, itemFinance, num } from "@/lib/briquepro";
import { buildOverview, saleByItem, useWorkspace } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios — BriquePro" },
      {
        name: "description",
        content: "Lucro por categoria, ranking de itens e histórico completo de movimentações.",
      },
      { property: "og:title", content: "Relatórios no BriquePro" },
      { property: "og:description", content: "Resultados por categoria e histórico geral das negociações." },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const { data } = useWorkspace();
  if (!data) return <p className="num text-[12px] text-faint">carregando…</p>;

  const sales = saleByItem(data);
  const overview = buildOverview(data);
  const finances = data.items.map((item) => ({
    item,
    f: itemFinance(item, data.costs, sales.get(item.id)),
  }));

  const byCategory = CATEGORY_LIST.map((category) => {
    const rows = finances.filter((r) => r.item.category === category);
    return {
      category,
      count: rows.length,
      invested: rows.reduce((a, r) => a + r.f.totalCost, 0),
      profit: rows.reduce((a, r) => a + (r.f.profit ?? 0), 0),
      potential: rows.reduce((a, r) => a + (r.f.profit === null ? r.f.potentialProfit : 0), 0),
    };
  }).filter((r) => r.count > 0);

  const maxProfit = Math.max(1, ...byCategory.map((r) => Math.abs(r.profit)));
  const ranking = finances
    .filter((r) => r.f.profit !== null)
    .sort((a, b) => (b.f.profit ?? 0) - (a.f.profit ?? 0));

  const itemName = (id: string) => data.items.find((i) => i.id === id)?.name ?? "item removido";

  return (
    <>
      <PageHeader title="Relatórios e histórico" subtitle="resultado consolidado da operação" />

      <section className="grid gap-3 md:grid-cols-4">
        <Kpi label="Lucro acumulado" value={brl(overview.accumulatedProfit)} tone="accent" />
        <Kpi label="Investido em estoque" value={brl(overview.invested)} />
        <Kpi label="Lucro potencial" value={brl(overview.potentialProfit)} />
        <Kpi
          label="Itens negociados"
          value={String(overview.salesCount + overview.tradesCount)}
          hint={`${overview.salesCount} vendas · ${overview.tradesCount} trocas`}
        />
      </section>

      <Panel title="Resultado por categoria" count={byCategory.length}>
        {byCategory.length === 0 ? (
          <EmptyState title="Sem dados suficientes" />
        ) : (
          <div className="space-y-3 p-4">
            {byCategory.map((row) => (
              <div key={row.category}>
                <div className="flex items-baseline gap-2">
                  <span className="text-[12px]">{CATEGORY_LABEL[row.category]}</span>
                  <span className="num text-[10px] text-faint">{row.count} itens · investido {brl(row.invested)}</span>
                  <span className="ml-auto">
                    <Money value={row.profit} signed />
                  </span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-panel2">
                  <div
                    className={row.profit < 0 ? "h-1.5 rounded-full bg-danger" : "h-1.5 rounded-full bg-accent"}
                    style={{ width: `${(Math.abs(row.profit) / maxProfit) * 100}%` }}
                  />
                </div>
                <p className="num mt-1 text-[10px] text-faint">
                  potencial em aberto: {brl(row.potential)}
                </p>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <div className="grid gap-3 xl:grid-cols-2">
        <Panel title="Ranking de resultado" count={ranking.length}>
          {ranking.length === 0 ? (
            <EmptyState title="Nenhum item finalizado ainda" />
          ) : (
            <div className="divide-y divide-line">
              {ranking.map(({ item, f }) => (
                <Link
                  key={item.id}
                  to="/itens/$id"
                  params={{ id: item.id }}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-panel2"
                >
                  <span className="truncate text-[12px]">{item.name}</span>
                  <span className="num ml-auto text-[10px] text-faint">custo {brl(f.totalCost)}</span>
                  <Money value={f.profit ?? 0} signed />
                </Link>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Histórico completo" count={data.events.length}>
          {data.events.length === 0 ? (
            <EmptyState title="Sem movimentações" />
          ) : (
            <div className="max-h-[420px] divide-y divide-line overflow-y-auto">
              {data.events.map((event) => (
                <div key={event.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-[12px]">
                      {EVENT_LABEL[event.kind]} · {itemName(event.item_id)}
                    </p>
                    <p className="num text-[10px] text-faint">{dateTimeBR(event.happened_at)}</p>
                  </div>
                  {event.amount !== null && (
                    <span className="num ml-auto text-[12px]">{brl(num(event.amount))}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
