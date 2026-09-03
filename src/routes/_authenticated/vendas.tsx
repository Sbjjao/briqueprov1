import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { SaleModal } from "./itens.$id";
import { Select } from "@/components/briq/form";
import { EmptyState, Kpi, Money, Panel, Percent, PageHeader } from "@/components/briq/primitives";
import { brl, dateBR, itemFinance, num } from "@/lib/briquepro";
import { useWorkspace } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/vendas")({
  head: () => ({
    meta: [
      { title: "Vendas — BriquePro" },
      {
        name: "description",
        content: "Todas as vendas com valor líquido, taxas, frete, lucro real e margem por item.",
      },
      { property: "og:title", content: "Vendas no BriquePro" },
      { property: "og:description", content: "Resultado real de cada venda realizada." },
    ],
  }),
  component: SalesPage,
});

function SalesPage() {
  const { data } = useWorkspace();
  const [newFor, setNewFor] = useState("");

  if (!data) return <p className="num text-[12px] text-faint">carregando…</p>;

  const available = data.items.filter(
    (i) => i.status !== "vendido" && !data.sales.some((s) => s.item_id === i.id),
  );
  const rows = data.sales.map((sale) => {
    const item = data.items.find((i) => i.id === sale.item_id);
    const finance = item ? itemFinance(item, data.costs, sale) : null;
    return { sale, item, finance };
  });

  const gross = rows.reduce((acc, r) => acc + num(r.sale.sold_value), 0);
  const net = rows.reduce((acc, r) => acc + (r.finance?.netSale ?? 0), 0);
  const profit = rows.reduce((acc, r) => acc + (r.finance?.profit ?? 0), 0);
  const selected = data.items.find((i) => i.id === newFor);

  return (
    <>
      <PageHeader title="Vendas" subtitle={`${rows.length} vendas registradas`} />

      <section className="grid gap-3 md:grid-cols-4">
        <Kpi label="Faturamento bruto" value={brl(gross)} />
        <Kpi label="Valor líquido" value={brl(net)} hint="após taxas e frete" />
        <Kpi label="Lucro real" value={brl(profit)} tone={profit < 0 ? "danger" : "accent"} />
        <Kpi
          label="Ticket médio"
          value={brl(rows.length ? gross / rows.length : 0)}
        />
      </section>

      <Panel
        title="Registrar nova venda"
      >
        <div className="grid gap-3 p-4 md:grid-cols-[1fr_auto]">
          <Select
            value={newFor}
            onChange={(e) => setNewFor(e.target.value)}
            className="mt-0"
            options={[
              { value: "", label: "Selecione um item disponível" },
              ...available.map((i) => ({ value: i.id, label: i.name })),
            ]}
          />
          <button
            disabled={!newFor}
            onClick={() => setNewFor(newFor)}
            className="h-10 rounded-md bg-accent px-4 text-[13px] font-semibold text-accent-foreground disabled:opacity-40"
          >
            Abrir formulário
          </button>
        </div>
      </Panel>

      <Panel title="Histórico de vendas" count={rows.length}>
        {rows.length === 0 ? (
          <EmptyState title="Nenhuma venda registrada" hint="registre a primeira venda acima" />
        ) : (
          <>
            <div className="label-mono grid grid-cols-12 border-b border-line px-4 py-2">
              <span className="col-span-3">Item</span>
              <span className="col-span-2">Data</span>
              <span className="col-span-2">Vendido</span>
              <span className="col-span-2">Líquido</span>
              <span className="col-span-2 text-right">Lucro</span>
              <span className="col-span-1 text-right">Margem</span>
            </div>
            <div className="divide-y divide-line">
              {rows.map(({ sale, item, finance }) => (
                <div key={sale.id} className="grid grid-cols-12 items-center px-4 py-3">
                  <div className="col-span-3 min-w-0">
                    {item ? (
                      <Link to="/itens/$id" params={{ id: item.id }} className="truncate text-[13px] hover:text-accent">
                        {item.name}
                      </Link>
                    ) : (
                      <span className="text-[13px] text-faint">item removido</span>
                    )}
                  </div>
                  <span className="num col-span-2 text-[12px] text-muted-foreground">
                    {dateBR(sale.sold_at)}
                  </span>
                  <span className="num col-span-2 text-[12px]">{brl(num(sale.sold_value))}</span>
                  <span className="num col-span-2 text-[12px]">{brl(finance?.netSale ?? 0)}</span>
                  <div className="col-span-2 text-right">
                    <Money value={finance?.profit ?? 0} signed />
                  </div>
                  <div className="col-span-1 text-right">
                    <Percent value={finance?.margin ?? 0} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Panel>

      {selected && (
        <SaleModal
          open
          onClose={() => setNewFor("")}
          itemId={selected.id}
          contacts={data.contacts}
          suggested={num(selected.estimated_value)}
        />
      )}
    </>
  );
}
