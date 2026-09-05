import { useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { brl, num, type ItemCategory } from "@/lib/briquepro";
import { useAction } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Field, Modal, NumberInput, SubmitRow, TextInput } from "./form";

interface Template {
  key: string;
  label: string;
  category: ItemCategory;
  namePlaceholder: string;
  /** rótulo do campo de identificação (IMEI, chassi, série…) */
  serialLabel: string;
  extraLabel: string;
  extraPlaceholder: string;
}

export const TEMPLATES: Template[] = [
  {
    key: "celular",
    label: "Celular",
    category: "celulares",
    namePlaceholder: "iPhone 12 128GB",
    serialLabel: "IMEI",
    extraLabel: "Estado / bateria",
    extraPlaceholder: "bateria 87%, sem marcas",
  },
  {
    key: "videogame",
    label: "Videogame",
    category: "games",
    namePlaceholder: "PS4 Slim 1TB",
    serialLabel: "Nº de série",
    extraLabel: "Acessórios",
    extraPlaceholder: "2 controles, 3 jogos",
  },
  {
    key: "informatica",
    label: "Notebook / informática",
    category: "informatica",
    namePlaceholder: "Notebook Dell i5 8GB",
    serialLabel: "Service tag / série",
    extraLabel: "Configuração",
    extraPlaceholder: "i5 10ª, 8GB, SSD 256",
  },
  {
    key: "automotiva",
    label: "Peça automotiva",
    category: "carros_pecas",
    namePlaceholder: "Farol Gol G5 direito",
    serialLabel: "Código da peça",
    extraLabel: "Aplicação",
    extraPlaceholder: "Gol G5 2010-2013",
  },
  {
    key: "colecionavel",
    label: "Colecionável",
    category: "colecionaveis",
    namePlaceholder: "Álbum figurinhas 1998",
    serialLabel: "Edição / referência",
    extraLabel: "Conservação",
    extraPlaceholder: "completo, capa dura",
  },
  {
    key: "outros",
    label: "Outros",
    category: "outros",
    namePlaceholder: "Item usado",
    serialLabel: "Identificação",
    extraLabel: "Observação",
    extraPlaceholder: "detalhe curto",
  },
];

export function QuickItemModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (id: string) => void;
}) {
  const [templateKey, setTemplateKey] = useState("celular");
  const template = TEMPLATES.find((t) => t.key === templateKey) ?? TEMPLATES[0]!;
  const [form, setForm] = useState({
    name: "",
    serial: "",
    extra: "",
    purchase: "",
    estimated: "",
    quantity: "1",
  });

  const reset = () =>
    setForm({ name: "", serial: "", extra: "", purchase: "", estimated: "", quantity: "1" });

  const save = useAction(async () => {
    const quantity = Math.max(1, Math.round(num(form.quantity)) || 1);
    const { data, error } = await supabase
      .from("items")
      .insert({
        name: form.name,
        category: template.category,
        description: form.extra || null,
        serial: form.serial || null,
        quantity,
        purchase_value: num(form.purchase),
        estimated_value: num(form.estimated),
        status: "em_estoque",
        acquired_at: new Date().toISOString().slice(0, 10),
      })
      .select("id")
      .single();
    if (error) throw error;

    if (num(form.purchase) > 0 && data) {
      await supabase.from("item_events").insert({
        item_id: data.id,
        kind: "compra",
        title: `Cadastro rápido (${quantity} un.)`,
        amount: num(form.purchase) * quantity,
      });
    }
    reset();
    if (data) onCreated?.(data.id);
  }, "Item cadastrado", onClose);

  const margin = num(form.estimated) - num(form.purchase);

  return (
    <Modal open={open} onClose={onClose} title="Cadastro rápido">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate(undefined as never);
        }}
      >
        <p className="label-mono">Modelo de cadastro</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTemplateKey(t.key)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-[12px]",
                t.key === templateKey
                  ? "border-accent/50 bg-accent/10 text-accent"
                  : "border-line text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Field label="Nome do item" className="md:col-span-2">
            <TextInput
              required
              autoFocus
              placeholder={template.namePlaceholder}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Valor de compra">
            <NumberInput
              value={form.purchase}
              onChange={(e) => setForm({ ...form, purchase: e.target.value })}
            />
          </Field>
          <Field label="Valor estimado de revenda">
            <NumberInput
              value={form.estimated}
              onChange={(e) => setForm({ ...form, estimated: e.target.value })}
            />
          </Field>
          <Field label={template.serialLabel}>
            <TextInput
              value={form.serial}
              onChange={(e) => setForm({ ...form, serial: e.target.value })}
            />
          </Field>
          <Field label="Quantidade">
            <NumberInput
              step="1"
              min="1"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
          </Field>
          <Field label={template.extraLabel} className="md:col-span-2">
            <TextInput
              placeholder={template.extraPlaceholder}
              value={form.extra}
              onChange={(e) => setForm({ ...form, extra: e.target.value })}
            />
          </Field>
        </div>

        <p className="num mt-4 text-[11px] text-faint">
          lucro bruto previsto por unidade:{" "}
          <span className={margin < 0 ? "text-danger" : "text-accent"}>{brl(margin)}</span> · depois
          você completa os dados na ficha do item.
        </p>
        <SubmitRow onCancel={onClose} pending={save.isPending} label="Cadastrar" />
      </form>
    </Modal>
  );
}
