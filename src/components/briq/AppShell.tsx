import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { brl, num } from "@/lib/briquepro";
import { buildOverview, useWorkspace } from "@/lib/data";

const NAV: { group: string; items: { to: string; label: string; key?: string }[] }[] = [
  {
    group: "Operação",
    items: [
      { to: "/dashboard", label: "Dashboard" },
      { to: "/itens", label: "Itens", key: "items" },
      { to: "/aquisicoes", label: "Aquisições", key: "acq" },
      { to: "/vendas", label: "Vendas", key: "sales" },
      { to: "/trocas", label: "Trocas / Briques", key: "trades" },
      { to: "/custos", label: "Custos extras", key: "costs" },
    ],
  },
  {
    group: "Longo prazo",
    items: [
      { to: "/contatos", label: "Contatos", key: "contacts" },
      { to: "/relatorios", label: "Relatórios" },
      { to: "/calculadora", label: "Calculadora", key: "calc" },
    ],
  },
];

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data } = useWorkspace();
  const [term, setTerm] = useState("");

  const counts: Record<string, string> = {
    items: String(data?.items.length ?? 0),
    acq: String(data?.items.filter((i) => num(i.purchase_value) > 0).length ?? 0),
    sales: String(data?.sales.length ?? 0),
    trades: String(data?.trades.length ?? 0),
    costs: String(data?.costs.length ?? 0),
    contacts: String(data?.contacts.length ?? 0),
    calc: "∑",
  };

  const overview = data ? buildOverview(data) : null;
  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="flex min-h-screen bg-surface font-sans text-foreground">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line md:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-line px-5">
          <div className="grid size-7 place-items-center rounded-md border border-accent/30 bg-accent/15">
            <span className="num text-sm font-semibold text-accent">B</span>
          </div>
          <div className="leading-tight">
            <p className="text-[13px] font-semibold tracking-tight">BriquePro</p>
            <p className="label-mono">v1 · MVP</p>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 px-3 py-4">
          {NAV.map((group) => (
            <div key={group.group}>
              <p className="label-mono px-2.5 pt-4 pb-1 first:pt-0">{group.group}</p>
              {group.items.map((item) => {
                const active = pathname === item.to || pathname.startsWith(item.to + "/");
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex items-center justify-between rounded-md px-2.5 py-2",
                      active
                        ? "border border-line bg-panel2 text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <span className={cn("text-[13px]", active && "font-medium")}>{item.label}</span>
                    <span
                      className={cn("num text-[10px]", active ? "text-accent" : "text-faint")}
                    >
                      {item.key ? counts[item.key] : active ? "•" : "—"}
                    </span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="border-t border-line p-3">
          <div className="rounded-md border border-line bg-panel2 p-3">
            <p className="label-mono">Lucro acumulado</p>
            <p className="num mt-0.5 text-lg text-accent">
              {brl(overview?.accumulatedProfit ?? 0)}
            </p>
          </div>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/auth" });
            }}
            className="num mt-2 w-full rounded-md border border-line px-2 py-1.5 text-[11px] text-muted-foreground hover:text-foreground"
          >
            Sair
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-line px-6">
          <div>
            <p className="text-sm font-semibold tracking-tight">BriquePro</p>
            <p className="num text-[10px] text-faint">{today}</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                navigate({ to: "/itens", search: { q: term, novo: false } });
              }}
              className="hidden h-9 items-center gap-2 rounded-md border border-line bg-panel px-3 lg:flex"
            >
              <span className="num text-sm text-faint">/</span>
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Buscar item, IMEI, contato…"
                className="w-60 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
              />
            </form>
            <Link
              to="/itens"
              search={{ novo: true, q: "" }}
              className="flex h-9 items-center rounded-md bg-accent px-3 text-[13px] font-semibold text-accent-foreground"
            >
              + Novo item
            </Link>
          </div>
        </header>
        <main className="flex-1 space-y-6 p-6">{children}</main>
      </div>
    </div>
  );
}
