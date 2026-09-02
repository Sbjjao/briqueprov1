import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { ItemFormModal } from "@/components/briq/ItemFormModal";
import { Field, Modal, NumberInput, Select, SubmitRow, TextInput } from "@/components/briq/form";
import { EmptyState, Kpi, Panel, StatusBadge } from "@/components/briq/primitives";
import { supabase } from "@/integrations/supabase/client";
import {
  CATEGORY_LABEL,
  COST_LABEL,
  COST_LIST,
  EVENT_LABEL,
  STATUS_LABEL,
  STATUS_LIST,
  brl,
  dateBR,
  dateTimeBR,
  itemFinance,
  num,
  pct,
} from "@/lib/briquepro";
import { saleByItem, tradeChain, useAction, useWorkspace } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/itens/$id")({
  head: () => ({
    meta: [
      { title: "Ficha do item — BriquePro" },
      {
        name: "description",
        content: "Custo total, lucro, margem, timeline e árvore de brique do item.",
      },
      { property: "og:title", content: "Ficha do item — BriquePro" },
      { property: "og:description", content: "Histórico completo e resultado real do item." },
    ],
  }),
  component: ItemDetail,
});

function ItemDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data } = useWorkspace();
  const [modal, setModal] = useState<"none" | "cost" | "sale" | "event" | "edit">("none");
  const close = () => setModal("none");

  const remove = useAction(async () => {
    const { error } = await supabase.from("items").delete().eq("id", id);
    if (error) throw error;
    navigate({ to: "/itens", search: { q: "", novo: false } });
  }, "Item excluído");

  if (!data) return <p className="num text-[12px] text-faint">carregando…</p>;
  const item = data.items.find((i) => i.id === id);
  if (!item) return <EmptyState title="Item não encontrado" />;

  const sale = saleByItem(data).get(item.id) ?? null;
  const finance = itemFinance(item, data.costs, sale);
  const costs = data.costs.filter((c) => c.item_id === item.id);
  const events = data.events.filter((e) => e.item_id === item.id);
  const chain = tradeChain(data, item.id);
  const contactName = (cid: string | null) =>
    cid ? (data.contacts.find((c) => c.id === cid)?.name ?? "—") : "—";

  return (
    <>
      <div className="flex flex-wrap items-start gap-4">
        <div className="min-w-0">
          <Link to="/itens" search={{ q: "", novo: false }} className="num text-[10px] text-faint">
            ← itens
          </Link>
          <h1 className="mt-1 text-lg font-semibold tracking-tight">{item.name}</h1>
          <p className="num text-[10px] text-faint">
            {CATEGORY_LABEL[item.category]}
            {item.brand ? ` · ${item.brand}` : ""}
            {item.model ? ` ${item.model}` : ""}
            {item.color ? ` · ${item.color}` : ""}
            {item.serial ? ` · ${item.serial}` : ""}
          </p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <StatusBadge status={item.status} />
          <Select
            value={item.status}
            onChange={async (e) => {
              await supabase
                .from("items")
                .update({ status: e.target.value as typeof item.status })
                .eq("id", item.id);
              window.location.reload();
            }}
            options={STATUS_LIST.map((s) => ({ value: s, label: STATUS_LABEL[s] }))}
            className="mt-0 w-44"
          />
          <button
            onClick={() => setModal("edit")}
            className="h-10 rounded-md border border-line px-3 text-[13px]"
          >
            Editar
          </button>
          <button
            onClick={() => setModal("cost")}
            className="h-10 rounded-md border border-line px-3 text-[13px]"
          >
            + Custo
          </button>
          <button
            onClick={() => setModal("event")}
            className="h-10 rounded-md border border-line px-3 text-[13px]"
          >
            + Evento
          </button>
          {!sale && (
            <button
              onClick={() => setModal("sale")}
              className="h-10 rounded-md bg-accent px-3 text-[13px] font-semibold text-accent-foreground"
            >
              Registrar venda
            </button>
          )}
        </div>
      </div>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Custo total" value={brl(finance.totalCost)} hint={`compra ${brl(num(item.purchase_value))} + extras ${brl(finance.extraCost)}`} />
        <Kpi
          label={sale ? "Valor líquido da venda" : "Valor estimado"}
          value={brl(sale ? (finance.netSale ?? 0) : num(item.estimated_value))}
          hint={sale ? "vendido − taxas − frete" : "valor de mercado hoje"}
        />
        <Kpi
          label={sale ? "Lucro" : "Lucro potencial"}
          value={brl(sale ? (finance.profit ?? 0) : finance.potentialProfit)}
          tone={(sale ? (finance.profit ?? 0) : finance.potentialProfit) < 0 ? "danger" : "accent"}
        />
        <Kpi
          label="Margem"
          value={pct(sale ? (finance.margin ?? 0) : finance.potentialMargin)}
          tone={(sale ? (finance.margin ?? 0) : finance.potentialMargin) < 0 ? "danger" : "default"}
        />
      </section>

      <div className="grid gap-3 xl:grid-cols-3">
        <Panel title="Timeline do item" count={events.length} className="xl:col-span-2">
          {events.length === 0 ? (
            <EmptyState title="Nenhum evento registrado" />
          ) : (
            <div className="p-4">
              {events.map((event, index) => (
                <div key={event.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className="mt-1 size-2 rounded-full bg-accent" />
                    {index < events.length - 1 && <span className="w-px flex-1 bg-line" />}
                  </div>
                  <div className="pb-4">
                    <p className="text-[12px] font-medium">
                      {event.title || EVENT_LABEL[event.kind]}
                    </p>
                    <p className="num text-[10px] text-faint">
                      {dateTimeBR(event.happened_at)}
                      {event.amount !== null ? ` · ${brl(num(event.amount))}` : ""}
                      {event.detail ? ` · ${event.detail}` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <div className="space-y-3">
          <Panel title="Dados da aquisição">
            <dl className="space-y-2 p-4 text-[12px]">
              <Row label="Data de aquisição" value={dateBR(item.acquired_at)} />
              <Row label="Valor de compra" value={brl(num(item.purchase_value))} />
              <Row label="Forma de pagamento" value={item.payment_method || "—"} />
              <Row label="Comprado de" value={contactName(item.seller_contact_id)} />
            </dl>
          </Panel>

          <Panel title="Custos extras" count={costs.length}>
            {costs.length === 0 ? (
              <EmptyState title="Sem custos extras" />
            ) : (
              <div className="divide-y divide-line">
                {costs.map((cost) => (
                  <div key={cost.id} className="flex items-center gap-2 px-4 py-2.5">
                    <div className="min-w-0">
                      <p className="text-[12px]">{COST_LABEL[cost.kind]}</p>
                      <p className="num truncate text-[10px] text-faint">
                        {dateBR(cost.spent_at)}
                        {cost.description ? ` · ${cost.description}` : ""}
                      </p>
                    </div>
                    <span className="num ml-auto text-[12px]">{brl(num(cost.amount))}</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          {sale && (
            <Panel title="Venda">
              <dl className="space-y-2 p-4 text-[12px]">
                <Row label="Valor anunciado" value={brl(num(sale.listed_value))} />
                <Row label="Valor mínimo aceito" value={brl(num(sale.min_value))} />
                <Row label="Valor vendido" value={brl(num(sale.sold_value))} />
                <Row label="Taxas" value={brl(num(sale.fees))} />
                <Row label="Frete pago por você" value={brl(num(sale.shipping))} />
                <Row label="Data" value={dateBR(sale.sold_at)} />
                <Row label="Comprador" value={contactName(sale.buyer_contact_id)} />
              </dl>
            </Panel>
          )}
        </div>
      </div>

      <Panel title="Árvore do brique" count={chain.length}>
        <div className="flex flex-wrap items-center gap-2 p-4">
          {chain.map((node, index) => (
            <div key={node.id} className="flex items-center gap-2">
              <Link
                to="/itens/$id"
                params={{ id: node.id }}
                className={
                  "rounded-md border px-3 py-2 " +
                  (node.id === item.id ? "border-accent/40 bg-accent/10" : "border-line bg-panel2")
                }
              >
                <p className="text-[12px] font-medium">{node.name}</p>
                <p className="num text-[10px] text-faint">
                  {STATUS_LABEL[node.status]} · custo {brl(itemFinance(node, data.costs, saleByItem(data).get(node.id)).totalCost)}
                </p>
              </Link>
              {index < chain.length - 1 && <span className="num text-accent">→</span>}
            </div>
          ))}
        </div>
      </Panel>

      <button
        onClick={() => remove.mutate(undefined as never)}
        className="num text-[11px] text-danger hover:underline"
      >
        excluir item
      </button>

      <ItemFormModal open={modal === "edit"} onClose={close} contacts={data.contacts} item={item} />
      <CostModal open={modal === "cost"} onClose={close} itemId={item.id} />
      <EventModal open={modal === "event"} onClose={close} itemId={item.id} />
      <SaleModal
        open={modal === "sale"}
        onClose={close}
        itemId={item.id}
        contacts={data.contacts}
        suggested={num(item.estimated_value)}
      />
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="label-mono">{label}</dt>
      <dd className="num text-[12px]">{value}</dd>
    </div>
  );
}

export function CostModal({
  open,
  onClose,
  itemId,
}: {
  open: boolean;
  onClose: () => void;
  itemId: string;
}) {
  const [kind, setKind] = useState("manutencao");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [spentAt, setSpentAt] = useState(new Date().toISOString().slice(0, 10));

  const save = useAction(async () => {
    const { error } = await supabase.from("extra_costs").insert({
      item_id: itemId,
      kind: kind as never,
      amount: num(amount),
      description: description || null,
      spent_at: spentAt,
    });
    if (error) throw error;
    await supabase.from("item_events").insert({
      item_id: itemId,
      kind: "gasto",
      title: `Gasto adicional · ${COST_LABEL[kind as keyof typeof COST_LABEL]}`,
      detail: description || null,
      amount: num(amount),
    });
    setAmount("");
    setDescription("");
  }, "Custo registrado", onClose);

  return (
    <Modal open={open} onClose={onClose} title="Novo custo adicional">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate(undefined as never);
        }}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Tipo">
            <Select
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              options={COST_LIST.map((c) => ({ value: c, label: COST_LABEL[c] }))}
            />
          </Field>
          <Field label="Valor">
            <NumberInput required value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <Field label="Data">
            <TextInput type="date" value={spentAt} onChange={(e) => setSpentAt(e.target.value)} />
          </Field>
          <Field label="Descrição">
            <TextInput value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
        </div>
        <SubmitRow onCancel={onClose} pending={save.isPending} />
      </form>
    </Modal>
  );
}

function EventModal({
  open,
  onClose,
  itemId,
}: {
  open: boolean;
  onClose: () => void;
  itemId: string;
}) {
  const [kind, setKind] = useState("anuncio");
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [amount, setAmount] = useState("");

  const save = useAction(async () => {
    const { error } = await supabase.from("item_events").insert({
      item_id: itemId,
      kind: kind as never,
      title: title || EVENT_LABEL[kind as keyof typeof EVENT_LABEL],
      detail: detail || null,
      amount: amount ? num(amount) : null,
    });
    if (error) throw error;
    setTitle("");
    setDetail("");
    setAmount("");
  }, "Evento adicionado", onClose);

  return (
    <Modal open={open} onClose={onClose} title="Novo evento na timeline">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate(undefined as never);
        }}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Tipo">
            <Select
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              options={Object.entries(EVENT_LABEL).map(([value, label]) => ({ value, label }))}
            />
          </Field>
          <Field label="Valor (opcional)">
            <NumberInput value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <Field label="Título" className="md:col-span-2">
            <TextInput value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Detalhe" className="md:col-span-2">
            <TextInput value={detail} onChange={(e) => setDetail(e.target.value)} />
          </Field>
        </div>
        <SubmitRow onCancel={onClose} pending={save.isPending} />
      </form>
    </Modal>
  );
}

export function SaleModal({
  open,
  onClose,
  itemId,
  contacts,
  suggested,
}: {
  open: boolean;
  onClose: () => void;
  itemId: string;
  contacts: { id: string; name: string }[];
  suggested: number;
}) {
  const [form, setForm] = useState({
    listed: String(suggested || ""),
    min: "",
    sold: "",
    date: new Date().toISOString().slice(0, 10),
    payment: "",
    fees: "",
    shipping: "",
    buyer: "",
  });

  const save = useAction(async () => {
    const { error } = await supabase.from("sales").insert({
      item_id: itemId,
      listed_value: num(form.listed),
      min_value: num(form.min),
      sold_value: num(form.sold),
      sold_at: form.date,
      payment_method: form.payment || null,
      fees: num(form.fees),
      shipping: num(form.shipping),
      buyer_contact_id: form.buyer || null,
    });
    if (error) throw error;
    await supabase.from("items").update({ status: "vendido" }).eq("id", itemId);
    await supabase.from("item_events").insert({
      item_id: itemId,
      kind: "venda",
      title: "Venda final",
      detail: form.payment || null,
      amount: num(form.sold),
    });
  }, "Venda registrada", onClose);

  return (
    <Modal open={open} onClose={onClose} title="Registrar venda" wide>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate(undefined as never);
        }}
      >
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Valor anunciado">
            <NumberInput value={form.listed} onChange={(e) => setForm({ ...form, listed: e.target.value })} />
          </Field>
          <Field label="Valor mínimo aceito">
            <NumberInput value={form.min} onChange={(e) => setForm({ ...form, min: e.target.value })} />
          </Field>
          <Field label="Valor vendido">
            <NumberInput required value={form.sold} onChange={(e) => setForm({ ...form, sold: e.target.value })} />
          </Field>
          <Field label="Data da venda">
            <TextInput type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </Field>
          <Field label="Forma de pagamento">
            <TextInput value={form.payment} onChange={(e) => setForm({ ...form, payment: e.target.value })} />
          </Field>
          <Field label="Comprador">
            <Select
              value={form.buyer}
              onChange={(e) => setForm({ ...form, buyer: e.target.value })}
              options={[{ value: "", label: "—" }, ...contacts.map((c) => ({ value: c.id, label: c.name }))]}
            />
          </Field>
          <Field label="Taxas">
            <NumberInput value={form.fees} onChange={(e) => setForm({ ...form, fees: e.target.value })} />
          </Field>
          <Field label="Frete pago por você">
            <NumberInput value={form.shipping} onChange={(e) => setForm({ ...form, shipping: e.target.value })} />
          </Field>
        </div>
        <p className="num mt-4 text-[11px] text-faint">
          valor líquido: {brl(num(form.sold) - num(form.fees) - num(form.shipping))}
        </p>
        <SubmitRow onCancel={onClose} pending={save.isPending} label="Registrar venda" />
      </form>
    </Modal>
  );
}
