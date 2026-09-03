import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { Field, Modal, NumberInput, Select, SubmitRow, TextArea, TextInput } from "@/components/briq/form";
import { EmptyState, Kpi, Money, Panel, PageHeader } from "@/components/briq/primitives";
import { supabase } from "@/integrations/supabase/client";
import { brl, dateBR, num } from "@/lib/briquepro";
import { useAction, useWorkspace } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/trocas")({
  head: () => ({
    meta: [
      { title: "Trocas e briques — BriquePro" },
      {
        name: "description",
        content: "Registre trocas com volta em dinheiro e acompanhe o ganho ou perda de cada brique.",
      },
      { property: "og:title", content: "Trocas no BriquePro" },
      { property: "og:description", content: "Controle de briques com valores atribuídos e diferença." },
    ],
  }),
  component: TradesPage,
});

function TradesPage() {
  const { data } = useWorkspace();
  const [open, setOpen] = useState(false);

  if (!data) return <p className="num text-[12px] text-faint">carregando…</p>;

  const itemName = (id: string | null) =>
    id ? (data.items.find((i) => i.id === id)?.name ?? "—") : "—";
  const balance = data.trades.reduce(
    (acc, t) => acc + num(t.cash_received) - num(t.cash_paid),
    0,
  );

  return (
    <>
      <PageHeader
        title="Trocas / briques"
        subtitle={`${data.trades.length} trocas registradas`}
        actions={
          <button
            onClick={() => setOpen(true)}
            className="h-9 rounded-md bg-accent px-3 text-[13px] font-semibold text-accent-foreground"
          >
            + Nova troca
          </button>
        }
      />

      <section className="grid gap-3 md:grid-cols-3">
        <Kpi label="Saldo em dinheiro das trocas" value={brl(balance)} tone={balance < 0 ? "danger" : "accent"} />
        <Kpi
          label="Recebido de volta"
          value={brl(data.trades.reduce((a, t) => a + num(t.cash_received), 0))}
        />
        <Kpi label="Pago de volta" value={brl(data.trades.reduce((a, t) => a + num(t.cash_paid), 0))} />
      </section>

      <Panel title="Histórico de trocas" count={data.trades.length}>
        {data.trades.length === 0 ? (
          <EmptyState title="Nenhuma troca registrada" hint="registre seu primeiro brique" />
        ) : (
          <div className="divide-y divide-line">
            {data.trades.map((trade) => {
              const diff = num(trade.cash_received) - num(trade.cash_paid);
              const inItem = data.items.find((i) => i.id === trade.in_item_id);
              const gain = inItem
                ? num(inItem.estimated_value) - num(trade.out_assigned_value) + diff
                : diff;
              return (
                <div key={trade.id} className="grid gap-2 px-4 py-3 md:grid-cols-12 md:items-center">
                  <div className="num md:col-span-2 text-[11px] text-muted-foreground">
                    {dateBR(trade.traded_at)}
                  </div>
                  <div className="md:col-span-6 text-[13px]">
                    {trade.out_item_id ? (
                      <Link to="/itens/$id" params={{ id: trade.out_item_id }} className="hover:text-accent">
                        {itemName(trade.out_item_id)}
                      </Link>
                    ) : (
                      "—"
                    )}
                    <span className="num px-2 text-accent">→</span>
                    {trade.in_item_id ? (
                      <Link to="/itens/$id" params={{ id: trade.in_item_id }} className="hover:text-accent">
                        {itemName(trade.in_item_id)}
                      </Link>
                    ) : (
                      "—"
                    )}
                    <p className="num text-[10px] text-faint">
                      atribuído {brl(num(trade.out_assigned_value))} ↔ {brl(num(trade.in_assigned_value))}
                      {trade.notes ? ` · ${trade.notes}` : ""}
                    </p>
                  </div>
                  <div className="num md:col-span-2 text-[12px]">
                    volta: {brl(diff)}
                  </div>
                  <div className="md:col-span-2 md:text-right">
                    <Money value={gain} signed />
                    <p className="label-mono">ganho no brique</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <TradeModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function TradeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data } = useWorkspace();
  const [form, setForm] = useState({
    out: "",
    outValue: "",
    newName: "",
    inValue: "",
    estimated: "",
    cashReceived: "",
    cashPaid: "",
    contact: "",
    date: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  const save = useAction(async () => {
    const { data: created, error } = await supabase
      .from("items")
      .insert({
        name: form.newName,
        category: "outros",
        purchase_value: num(form.inValue),
        estimated_value: num(form.estimated || form.inValue),
        status: "em_estoque",
        parent_item_id: form.out || null,
        acquired_at: form.date,
      })
      .select("id")
      .single();
    if (error) throw error;

    const { error: tradeError } = await supabase.from("trades").insert({
      out_item_id: form.out || null,
      out_assigned_value: num(form.outValue),
      in_item_id: created.id,
      in_assigned_value: num(form.inValue),
      cash_received: num(form.cashReceived),
      cash_paid: num(form.cashPaid),
      contact_id: form.contact || null,
      traded_at: form.date,
      notes: form.notes || null,
    });
    if (tradeError) throw tradeError;

    if (form.out) {
      await supabase.from("items").update({ status: "trocado" }).eq("id", form.out);
      await supabase.from("item_events").insert({
        item_id: form.out,
        kind: "troca",
        title: `Trocado por ${form.newName}`,
        detail: form.notes || null,
        amount: num(form.outValue),
      });
    }
    await supabase.from("item_events").insert({
      item_id: created.id,
      kind: "troca",
      title: "Recebido em troca",
      detail: form.notes || null,
      amount: num(form.inValue),
    });
  }, "Troca registrada", onClose);

  const items = data?.items ?? [];

  return (
    <Modal open={open} onClose={onClose} title="Registrar troca / brique" wide>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate(undefined as never);
        }}
      >
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Item que sai" className="md:col-span-2">
            <Select
              value={form.out}
              onChange={(e) => setForm({ ...form, out: e.target.value })}
              options={[
                { value: "", label: "Nenhum (só entrada)" },
                ...items
                  .filter((i) => i.status !== "vendido" && i.status !== "trocado")
                  .map((i) => ({ value: i.id, label: i.name })),
              ]}
            />
          </Field>
          <Field label="Valor atribuído (saída)">
            <NumberInput value={form.outValue} onChange={(e) => setForm({ ...form, outValue: e.target.value })} />
          </Field>
          <Field label="Item que entra" className="md:col-span-2">
            <TextInput
              required
              placeholder="Nome do item recebido"
              value={form.newName}
              onChange={(e) => setForm({ ...form, newName: e.target.value })}
            />
          </Field>
          <Field label="Valor atribuído (entrada)">
            <NumberInput value={form.inValue} onChange={(e) => setForm({ ...form, inValue: e.target.value })} />
          </Field>
          <Field label="Valor estimado de revenda">
            <NumberInput value={form.estimated} onChange={(e) => setForm({ ...form, estimated: e.target.value })} />
          </Field>
          <Field label="Dinheiro recebido">
            <NumberInput
              value={form.cashReceived}
              onChange={(e) => setForm({ ...form, cashReceived: e.target.value })}
            />
          </Field>
          <Field label="Dinheiro pago">
            <NumberInput value={form.cashPaid} onChange={(e) => setForm({ ...form, cashPaid: e.target.value })} />
          </Field>
          <Field label="Com quem">
            <Select
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
              options={[
                { value: "", label: "—" },
                ...(data?.contacts ?? []).map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
          </Field>
          <Field label="Data">
            <TextInput type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </Field>
          <Field label="Observações" className="md:col-span-3">
            <TextArea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
        </div>
        <p className="num mt-4 text-[11px] text-faint">
          diferença em dinheiro: {brl(num(form.cashReceived) - num(form.cashPaid))} · o item recebido
          entra no estoque ligado ao item que saiu.
        </p>
        <SubmitRow onCancel={onClose} pending={save.isPending} label="Registrar troca" />
      </form>
    </Modal>
  );
}
