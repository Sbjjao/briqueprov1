import { useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import {
  CATEGORY_LABEL,
  CATEGORY_LIST,
  STATUS_LABEL,
  STATUS_LIST,
  brl,
  num,
  type Contact,
  type Item,
} from "@/lib/briquepro";
import { useAction } from "@/lib/data";
import { Field, Modal, NumberInput, Select, SubmitRow, TextArea, TextInput } from "./form";

interface Props {
  open: boolean;
  onClose: () => void;
  contacts: Contact[];
  item?: Item | null;
}

export function ItemFormModal({ open, onClose, contacts, item }: Props) {
  const [form, setForm] = useState(() => blank(item));

  // reinicia o formulário sempre que abre com outro item
  const [seed, setSeed] = useState(item?.id ?? "novo");
  const currentSeed = item?.id ?? "novo";
  if (open && seed !== currentSeed) {
    setSeed(currentSeed);
    setForm(blank(item));
  }

  const save = useAction(async () => {
    const payload = {
      name: form.name,
      category: form.category,
      description: form.description || null,
      brand: form.brand || null,
      model: form.model || null,
      color: form.color || null,
      serial: form.serial || null,
      photos: form.photo ? [form.photo] : [],
      acquired_at: form.acquired_at || null,
      estimated_value: num(form.estimated_value),
      quantity: Math.max(1, Math.round(num(form.quantity)) || 1),
      status: form.status,
      purchase_value: num(form.purchase_value),
      payment_method: form.payment_method || null,
      seller_contact_id: form.seller_contact_id || null,
    };


    if (item) {
      const { error } = await supabase.from("items").update(payload).eq("id", item.id);
      if (error) throw error;
      return;
    }

    const { data, error } = await supabase.from("items").insert(payload).select("id").single();
    if (error) throw error;
    if (num(form.purchase_value) > 0 && data) {
      await supabase.from("item_events").insert({
        item_id: data.id,
        kind: "compra",
        title: "Compra registrada",
        detail: form.payment_method ? `Pagamento: ${form.payment_method}` : null,
        amount: num(form.purchase_value),
      });
    }
  }, item ? "Item atualizado" : "Item cadastrado", onClose);

  const contactOptions = [
    { value: "", label: "—" },
    ...contacts.map((c) => ({ value: c.id, label: c.name })),
  ];

  return (
    <Modal open={open} onClose={onClose} title={item ? "Editar item" : "Cadastro de item"} wide>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate(undefined as never);
        }}
      >
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Nome do produto" className="md:col-span-2">
            <TextInput
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Categoria">
            <Select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as typeof form.category })}
              options={CATEGORY_LIST.map((c) => ({ value: c, label: CATEGORY_LABEL[c] }))}
            />
          </Field>
          <Field label="Marca">
            <TextInput value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
          </Field>
          <Field label="Modelo">
            <TextInput value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
          </Field>
          <Field label="Cor">
            <TextInput value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
          </Field>
          <Field label="Nº de série / IMEI">
            <TextInput value={form.serial} onChange={(e) => setForm({ ...form, serial: e.target.value })} />
          </Field>
          <Field label="Foto (URL)" className="md:col-span-2">
            <TextInput value={form.photo} onChange={(e) => setForm({ ...form, photo: e.target.value })} />
          </Field>
          <Field label="Descrição" className="md:col-span-3">
            <TextArea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>

          <Field label="Data de aquisição">
            <TextInput
              type="date"
              value={form.acquired_at}
              onChange={(e) => setForm({ ...form, acquired_at: e.target.value })}
            />
          </Field>
          <Field label="Valor de compra">
            <NumberInput
              value={form.purchase_value}
              onChange={(e) => setForm({ ...form, purchase_value: e.target.value })}
            />
          </Field>
          <Field label="Valor estimado atual">
            <NumberInput
              value={form.estimated_value}
              onChange={(e) => setForm({ ...form, estimated_value: e.target.value })}
            />
          </Field>
          <Field label="Forma de pagamento">
            <TextInput
              placeholder="Pix, dinheiro, cartão…"
              value={form.payment_method}
              onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
            />
          </Field>
          <Field label="De quem comprou">
            <Select
              value={form.seller_contact_id}
              onChange={(e) => setForm({ ...form, seller_contact_id: e.target.value })}
              options={contactOptions}
            />
          </Field>
          <Field label="Status">
            <Select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })}
              options={STATUS_LIST.map((s) => ({ value: s, label: STATUS_LABEL[s] }))}
            />
          </Field>
        </div>

        <p className="num mt-4 text-[11px] text-faint">
          lucro potencial estimado: {brl(num(form.estimated_value) - num(form.purchase_value))} (antes
          dos custos extras)
        </p>

        <SubmitRow onCancel={onClose} pending={save.isPending} />
      </form>
    </Modal>
  );
}

function blank(item?: Item | null) {
  return {
    name: item?.name ?? "",
    category: item?.category ?? ("outros" as Item["category"]),
    description: item?.description ?? "",
    brand: item?.brand ?? "",
    model: item?.model ?? "",
    color: item?.color ?? "",
    serial: item?.serial ?? "",
    photo: item?.photos?.[0] ?? "",
    acquired_at: item?.acquired_at ?? "",
    estimated_value: String(item?.estimated_value ?? ""),
    status: item?.status ?? ("em_estoque" as Item["status"]),
    purchase_value: String(item?.purchase_value ?? ""),
    payment_method: item?.payment_method ?? "",
    seller_contact_id: item?.seller_contact_id ?? "",
  };
}
