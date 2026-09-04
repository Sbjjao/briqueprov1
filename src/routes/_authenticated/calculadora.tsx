import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { Field, NumberInput, Select } from "@/components/briq/form";
import { Kpi, Panel, PageHeader } from "@/components/briq/primitives";
import { brl, itemFinance, minimumSalePrice, num, pct } from "@/lib/briquepro";
import { saleByItem, useWorkspace } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/calculadora")({
  head: () => ({
    meta: [
      { title: "Calculadora de lucro — BriquePro" },
      {
        name: "description",
        content: "Descubra por quanto vender para bater a margem desejada, já com taxas e frete.",
      },
      { property: "og:title", content: "Calculadora de lucro do BriquePro" },
      { property: "og:description", content: "Preço mínimo de venda com margem, taxas e frete embutidos." },
    ],
  }),
  component: CalculatorPage,
});

function CalculatorPage() {
  const { data } = useWorkspace();
  const [itemId, setItemId] = useState("");
  const [purchase, setPurchase] = useState("");
  const [extra, setExtra] = useState("");
  const [margin, setMargin] = useState("30");
  const [fees, setFees] = useState("0");
  const [shipping, setShipping] = useState("0");

  const item = data?.items.find((i) => i.id === itemId);
  const linked = item && data ? itemFinance(item, data.costs, saleByItem(data).get(item.id)) : null;

  const totalCost = linked ? linked.totalCost : num(purchase) + num(extra);
  const result = minimumSalePrice({
    totalCost,
    desiredMarginPct: num(margin),
    feesPct: num(fees),
    shipping: num(shipping),
  });

  return (
    <>
      <PageHeader
        title="Calculadora de lucro"
        subtitle="por quanto preciso vender para valer a pena?"
      />

      <div className="grid gap-3 xl:grid-cols-2">
        <Panel title="Dados da operação">
          <div className="grid gap-3 p-4 md:grid-cols-2">
            <Field label="Usar um item cadastrado" className="md:col-span-2">
              <Select
                value={itemId}
                onChange={(e) => setItemId(e.target.value)}
                options={[
                  { value: "", label: "Simulação livre" },
                  ...(data?.items ?? []).map((i) => ({ value: i.id, label: i.name })),
                ]}
              />
            </Field>
            <Field label="Valor de compra">
              <NumberInput
                disabled={Boolean(item)}
                value={item ? String(num(item.purchase_value)) : purchase}
                onChange={(e) => setPurchase(e.target.value)}
              />
            </Field>
            <Field label="Custos extras">
              <NumberInput
                disabled={Boolean(item)}
                value={linked ? String(linked.extraCost) : extra}
                onChange={(e) => setExtra(e.target.value)}
              />
            </Field>
            <Field label="Margem desejada (%)">
              <NumberInput value={margin} onChange={(e) => setMargin(e.target.value)} />
            </Field>
            <Field label="Taxas da plataforma (%)">
              <NumberInput value={fees} onChange={(e) => setFees(e.target.value)} />
            </Field>
            <Field label="Frete pago por você">
              <NumberInput value={shipping} onChange={(e) => setShipping(e.target.value)} />
            </Field>
            <div className="md:col-span-2 rounded-md border border-line bg-panel2 p-3">
              <p className="label-mono">Custo total considerado</p>
              <p className="num mt-1 text-xl">{brl(totalCost)}</p>
            </div>
          </div>
        </Panel>

        <div className="space-y-3">
          <Kpi
            label="Preço mínimo de venda"
            value={brl(result.price)}
            tone="accent"
            hint="já cobrindo taxas, frete e a margem desejada"
          />
          <div className="grid gap-3 md:grid-cols-2">
            <Kpi label="Você recebe líquido" value={brl(result.net)} />
            <Kpi label="Taxas estimadas" value={brl(result.fees)} />
            <Kpi label="Lucro" value={brl(result.profit)} tone={result.profit < 0 ? "danger" : "default"} />
            <Kpi label="Margem real" value={pct(result.margin)} />
          </div>
          <Panel title="Faixas de preço">
            <div className="divide-y divide-line">
              {[10, 20, 30, 50, 80].map((m) => {
                const row = minimumSalePrice({
                  totalCost,
                  desiredMarginPct: m,
                  feesPct: num(fees),
                  shipping: num(shipping),
                });
                return (
                  <div key={m} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="num text-[12px] text-muted-foreground">margem {m}%</span>
                    <span className="num ml-auto text-[13px]">{brl(row.price)}</span>
                    <span className="num w-24 text-right text-[11px] text-accent">
                      lucro {brl(row.profit)}
                    </span>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
