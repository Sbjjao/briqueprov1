import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { CostModal } from "./itens.$id";
import { Select } from "@/components/briq/form";
import { EmptyState, Kpi, Panel, PageHeader } from "@/components/briq/primitives";
import { COST_LABEL, COST_LIST, brl, dateBR, num } from "@/lib/briquepro";
import { useWorkspace } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/custos")({
  head: () => ({
    meta: [
      { title: "Custos extras — BriquePro" },
      {
        name: "description",
        content: "Frete, manutenção, peças e taxas lançados em cada item para calcular o custo real.",
      },
      { property: "og:title", content: "Custos extras no BriquePro" },
      { property: "og:description", content: "Todo gasto adicional que entra no custo real do item." },
    ],
  }),
  component: CostsPage,
});

function CostsPage() {
  const { data } = useWorkspace();
  const [target, setTarget] = useState("");
  const [openFor, setOpenFor] = useState("");

  if (!data) return <p className="num text-[12px] text-faint">carregando…</p>;

  const itemName = (id: string) => data.items.find((i) => i.id === id)?.name ?? "item removido";
  const total = data.costs.reduce((acc, c) => acc + num(c.amount), 0);
  const byKind = COST_LIST.map((kind) => ({
    kind,
    total: data.costs.filter((c) => c.kind === kind).reduce((a, c) => a + num(c.amount), 0),
  }));

  return (
    <>
      <PageHeader title="Custos extras" subtitle={`${data.costs.length} lançamentos`} />

      <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Total em custos" value={brl(total)} tone="danger" />
        {byKind.map((row) => (
          <div key={row.kind} className="rounded-lg border border-line bg-panel p-3">
            <p className="label-mono">{COST_LABEL[row.kind]}</p>
            <p className="num mt-1 text-[15px]">{brl(row.total)}</p>
          </div>
        ))}
      </section>

      <Panel title="Lançar custo em um item">
        <div className="grid gap-3 p-4 md:grid-cols-[1fr_auto]">
          <Select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="mt-0"
            options={[
              { value: "", label: "Selecione o item" },
              ...data.items.map((i) => ({ value: i.id, label: i.name })),
            ]}
          />
          <button
            disabled={!target}
            onClick={() => setOpenFor(target)}
            className="h-10 rounded-md bg-accent px-4 text-[13px] font-semibold text-accent-foreground disabled:opacity-40"
          >
            Adicionar custo
          </button>
        </div>
      </Panel>

      <Panel title="Lançamentos" count={data.costs.length}>
        {data.costs.length === 0 ? (
          <EmptyState title="Nenhum custo lançado" hint="frete, peças e manutenção entram aqui" />
        ) : (
          <div className="divide-y divide-line">
            {data.costs.map((cost) => (
              <div key={cost.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0">
                  <Link
                    to="/itens/$id"
                    params={{ id: cost.item_id }}
                    className="truncate text-[13px] hover:text-accent"
                  >
                    {itemName(cost.item_id)}
                  </Link>
                  <p className="num truncate text-[10px] text-faint">
                    {COST_LABEL[cost.kind]} · {dateBR(cost.spent_at)}
                    {cost.description ? ` · ${cost.description}` : ""}
                  </p>
                </div>
                <span className="num ml-auto text-[13px]">{brl(num(cost.amount))}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {openFor && <CostModal open onClose={() => setOpenFor("")} itemId={openFor} />}
    </>
  );
}
