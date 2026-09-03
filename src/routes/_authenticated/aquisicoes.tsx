import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { EmptyState, Kpi, Panel, PageHeader, StatusBadge } from "@/components/briq/primitives";
import { CATEGORY_LABEL, brl, dateBR, num } from "@/lib/briquepro";
import { useWorkspace } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/aquisicoes")({
  head: () => ({
    meta: [
      { title: "Aquisições — BriquePro" },
      {
        name: "description",
        content: "Todas as compras registradas: data, valor pago, forma de pagamento e vendedor.",
      },
      { property: "og:title", content: "Aquisições no BriquePro" },
      { property: "og:description", content: "Histórico de compras e capital investido." },
    ],
  }),
  component: AcquisitionsPage,
});

function AcquisitionsPage() {
  const { data } = useWorkspace();
  const navigate = useNavigate();

  if (!data) return <p className="num text-[12px] text-faint">carregando…</p>;

  const rows = data.items
    .filter((i) => num(i.purchase_value) > 0 || i.acquired_at)
    .sort((a, b) => String(b.acquired_at ?? "").localeCompare(String(a.acquired_at ?? "")));
  const total = rows.reduce((acc, i) => acc + num(i.purchase_value), 0);
  const contactName = (id: string | null) =>
    id ? (data.contacts.find((c) => c.id === id)?.name ?? "—") : "—";

  return (
    <>
      <PageHeader
        title="Aquisições"
        subtitle={`${rows.length} compras registradas`}
        actions={
          <button
            onClick={() => navigate({ to: "/itens", search: { q: "", novo: true } })}
            className="h-9 rounded-md bg-accent px-3 text-[13px] font-semibold text-accent-foreground"
          >
            + Nova compra
          </button>
        }
      />

      <section className="grid gap-3 md:grid-cols-3">
        <Kpi label="Total investido em compras" value={brl(total)} />
        <Kpi label="Ticket médio de compra" value={brl(rows.length ? total / rows.length : 0)} />
        <Kpi
          label="Valor estimado das aquisições"
          value={brl(rows.reduce((acc, i) => acc + num(i.estimated_value), 0))}
          tone="accent"
        />
      </section>

      <Panel title="Histórico de compras" count={rows.length}>
        {rows.length === 0 ? (
          <EmptyState title="Nenhuma compra registrada" hint="cadastre um item com valor de compra" />
        ) : (
          <>
            <div className="label-mono grid grid-cols-12 border-b border-line px-4 py-2">
              <span className="col-span-4">Item</span>
              <span className="col-span-2">Data</span>
              <span className="col-span-2">Valor pago</span>
              <span className="col-span-2">Pagamento</span>
              <span className="col-span-2">Vendedor</span>
            </div>
            <div className="divide-y divide-line">
              {rows.map((item) => (
                <Link
                  key={item.id}
                  to="/itens/$id"
                  params={{ id: item.id }}
                  className="grid grid-cols-12 items-center px-4 py-3 hover:bg-panel2"
                >
                  <div className="col-span-4 min-w-0">
                    <p className="truncate text-[13px] font-medium">{item.name}</p>
                    <p className="num text-[10px] text-faint">{CATEGORY_LABEL[item.category]}</p>
                  </div>
                  <span className="num col-span-2 text-[12px] text-muted-foreground">
                    {dateBR(item.acquired_at)}
                  </span>
                  <span className="num col-span-2 text-[12px]">{brl(num(item.purchase_value))}</span>
                  <span className="col-span-2 text-[12px] text-muted-foreground">
                    {item.payment_method || "—"}
                  </span>
                  <div className="col-span-2 flex items-center justify-between gap-2">
                    <span className="truncate text-[12px] text-muted-foreground">
                      {contactName(item.seller_contact_id)}
                    </span>
                    <StatusBadge status={item.status} />
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </Panel>
    </>
  );
}
