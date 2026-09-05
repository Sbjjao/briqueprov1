import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { ItemFormModal } from "@/components/briq/ItemFormModal";
import {
  EmptyState,
  Money,
  Panel,
  Percent,
  PageHeader,
  StatusBadge,
} from "@/components/briq/primitives";
import { Select } from "@/components/briq/form";
import {
  CATEGORY_LABEL,
  CATEGORY_LIST,
  STATUS_LABEL,
  STATUS_LIST,
  brl,
  itemFinance,
  num,
} from "@/lib/briquepro";
import { saleByItem, useWorkspace } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/itens/")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search["q"] === "string" ? search["q"] : "",
    novo: search["novo"] === true || search["novo"] === "true",
  }),
  head: () => ({
    meta: [
      { title: "Itens — BriquePro" },
      {
        name: "description",
        content: "Cadastro e controle de todos os itens: estoque, anúncios, manutenção e vendas.",
      },
      { property: "og:title", content: "Itens no BriquePro" },
      { property: "og:description", content: "Todo o seu estoque com custo, lucro e margem por item." },
    ],
  }),
  component: ItemsPage,
});

function ItemsPage() {
  const { q, novo } = Route.useSearch();
  const navigate = useNavigate();
  const { data } = useWorkspace();
  const [term, setTerm] = useState(q);
  const [status, setStatus] = useState<string>("todos");
  const [category, setCategory] = useState<string>("todas");

  if (!data) return <p className="num text-[12px] text-faint">carregando…</p>;

  const sales = saleByItem(data);
  const needle = (term || q).toLowerCase().trim();
  const rows = data.items.filter((item) => {
    const matchesTerm =
      !needle ||
      [item.name, item.brand, item.model, item.serial, item.description]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle));
    const matchesStatus = status === "todos" || item.status === status;
    const matchesCategory = category === "todas" || item.category === category;
    return matchesTerm && matchesStatus && matchesCategory;
  });

  return (
    <>
      <PageHeader
        title="Itens / produtos"
        subtitle={`${rows.length} de ${data.items.length} cadastros · ${rows.reduce((a, i) => a + Math.max(1, num(i.quantity) || 1), 0)} unidades`}
        actions={
          <button
            onClick={() => navigate({ to: "/itens", search: { q, novo: true } })}
            className="h-9 rounded-md bg-accent px-3 text-[13px] font-semibold text-accent-foreground"
          >
            + Novo item
          </button>
        }
      />

      <div className="grid gap-3 md:grid-cols-4">
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Buscar nome, marca, IMEI…"
          className="h-10 rounded-md border border-line bg-panel px-3 text-[13px] outline-none focus:border-accent/50 md:col-span-2"
        />
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          options={[
            { value: "todos", label: "Todos os status" },
            ...STATUS_LIST.map((s) => ({ value: s, label: STATUS_LABEL[s] })),
          ]}
          className="mt-0"
        />
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          options={[
            { value: "todas", label: "Todas as categorias" },
            ...CATEGORY_LIST.map((c) => ({ value: c, label: CATEGORY_LABEL[c] })),
          ]}
          className="mt-0"
        />
      </div>

      <Panel title="Estoque e negociação" count={rows.length}>
        {rows.length === 0 ? (
          <EmptyState title="Nenhum item encontrado" hint="ajuste os filtros ou cadastre um item" />
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
                        {item.brand ? ` · ${item.brand}` : ""}
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

      <ItemFormModal
        open={novo}
        contacts={data.contacts}
        onClose={() => navigate({ to: "/itens", search: { q, novo: false } })}
      />
    </>
  );
}
