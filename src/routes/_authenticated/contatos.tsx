import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { Field, Modal, NumberInput, SubmitRow, TextArea, TextInput } from "@/components/briq/form";
import { EmptyState, Kpi, Panel, PageHeader } from "@/components/briq/primitives";
import { supabase } from "@/integrations/supabase/client";
import { brl, num } from "@/lib/briquepro";
import { useAction, useWorkspace } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/contatos")({
  head: () => ({
    meta: [
      { title: "Contatos — BriquePro" },
      {
        name: "description",
        content: "Compradores, vendedores e parceiros de troca com nível de confiança e histórico.",
      },
      { property: "og:title", content: "Contatos no BriquePro" },
      { property: "og:description", content: "Sua rede de brique organizada por confiança." },
    ],
  }),
  component: ContactsPage,
});

function ContactsPage() {
  const { data } = useWorkspace();
  const [open, setOpen] = useState(false);

  if (!data) return <p className="num text-[12px] text-faint">carregando…</p>;

  const stats = (contactId: string) => {
    const bought = data.items.filter((i) => i.seller_contact_id === contactId);
    const sold = data.sales.filter((s) => s.buyer_contact_id === contactId);
    const traded = data.trades.filter((t) => t.contact_id === contactId);
    return {
      negotiations: bought.length + sold.length + traded.length,
      volume:
        bought.reduce((a, i) => a + num(i.purchase_value), 0) +
        sold.reduce((a, s) => a + num(s.sold_value), 0),
    };
  };

  return (
    <>
      <PageHeader
        title="Contatos"
        subtitle={`${data.contacts.length} pessoas na sua rede`}
        actions={
          <button
            onClick={() => setOpen(true)}
            className="h-9 rounded-md bg-accent px-3 text-[13px] font-semibold text-accent-foreground"
          >
            + Novo contato
          </button>
        }
      />

      <section className="grid gap-3 md:grid-cols-3">
        <Kpi label="Contatos cadastrados" value={String(data.contacts.length)} />
        <Kpi
          label="Confiança média"
          value={
            data.contacts.length
              ? (
                  data.contacts.reduce((a, c) => a + num(c.trust), 0) / data.contacts.length
                ).toFixed(1) + " / 5"
              : "—"
          }
        />
        <Kpi
          label="Negociações vinculadas"
          value={String(data.contacts.reduce((a, c) => a + stats(c.id).negotiations, 0))}
          tone="accent"
        />
      </section>

      <Panel title="Rede de negociação" count={data.contacts.length}>
        {data.contacts.length === 0 ? (
          <EmptyState title="Nenhum contato cadastrado" hint="cadastre quem compra, vende ou troca com você" />
        ) : (
          <div className="divide-y divide-line">
            {data.contacts.map((contact) => {
              const s = stats(contact.id);
              return (
                <div key={contact.id} className="grid gap-1 px-4 py-3 md:grid-cols-12 md:items-center">
                  <div className="md:col-span-4 min-w-0">
                    <p className="truncate text-[13px] font-medium">{contact.name}</p>
                    <p className="num truncate text-[10px] text-faint">
                      {[contact.phone, contact.social, contact.city].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                  <div className="num md:col-span-3 text-[12px] text-accent">
                    {"★".repeat(Math.max(1, Math.min(5, num(contact.trust))))}
                    <span className="text-faint">
                      {"★".repeat(5 - Math.max(1, Math.min(5, num(contact.trust))))}
                    </span>
                  </div>
                  <div className="num md:col-span-2 text-[12px]">{s.negotiations} negócios</div>
                  <div className="num md:col-span-3 text-[12px] md:text-right">{brl(s.volume)}</div>
                  {contact.notes && (
                    <p className="num md:col-span-12 text-[10px] text-faint">{contact.notes}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <ContactModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function ContactModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    social: "",
    city: "",
    trust: "3",
    notes: "",
  });

  const save = useAction(async () => {
    const { error } = await supabase.from("contacts").insert({
      name: form.name,
      phone: form.phone || null,
      social: form.social || null,
      city: form.city || null,
      trust: Math.max(1, Math.min(5, num(form.trust))),
      notes: form.notes || null,
    });
    if (error) throw error;
    setForm({ name: "", phone: "", social: "", city: "", trust: "3", notes: "" });
  }, "Contato cadastrado", onClose);

  return (
    <Modal open={open} onClose={onClose} title="Novo contato">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate(undefined as never);
        }}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Nome" className="md:col-span-2">
            <TextInput required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Telefone / WhatsApp">
            <TextInput value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="Rede social">
            <TextInput value={form.social} onChange={(e) => setForm({ ...form, social: e.target.value })} />
          </Field>
          <Field label="Cidade">
            <TextInput value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </Field>
          <Field label="Confiança (1 a 5)">
            <NumberInput value={form.trust} onChange={(e) => setForm({ ...form, trust: e.target.value })} />
          </Field>
          <Field label="Observações" className="md:col-span-2">
            <TextArea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
        </div>
        <SubmitRow onCancel={onClose} pending={save.isPending} />
      </form>
    </Modal>
  );
}
