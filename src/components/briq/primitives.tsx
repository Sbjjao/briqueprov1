import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { STATUS_LABEL, brl, pct, type ItemStatus } from "@/lib/briquepro";

export function Panel({
  title,
  count,
  actions,
  children,
  className,
}: {
  title?: string;
  count?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-lg border border-line bg-panel", className)}>
      {(title || actions) && (
        <div className="flex h-12 items-center gap-2 border-b border-line px-4">
          {title && <p className="text-[13px] font-semibold">{title}</p>}
          {count !== undefined && <span className="num text-[10px] text-faint">{count}</span>}
          {actions && <div className="ml-auto flex items-center gap-1">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function Kpi({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "accent" | "danger";
}) {
  return (
    <div className="rounded-lg border border-line bg-panel p-4">
      <p className="label-mono">{label}</p>
      <p
        className={cn(
          "num mt-1.5 text-2xl",
          tone === "accent" && "text-accent",
          tone === "danger" && "text-danger",
        )}
      >
        {value}
      </p>
      {hint && <p className="num mt-1.5 text-[11px] text-faint">{hint}</p>}
    </div>
  );
}

const STATUS_TONE: Record<ItemStatus, string> = {
  anunciado: "border-accent/30 text-accent",
  em_negociacao: "border-warn/30 text-warn",
  reservado: "border-warn/30 text-warn",
  em_manutencao: "border-line text-muted-foreground",
  em_estoque: "border-line text-muted-foreground",
  trocado: "border-line text-muted-foreground",
  vendido: "border-accent/20 text-accent/80",
  cancelado: "border-danger/30 text-danger",
};

export function StatusBadge({ status }: { status: ItemStatus }) {
  return (
    <span
      className={cn(
        "num inline-block rounded border px-2 py-0.5 text-[10px] whitespace-nowrap",
        STATUS_TONE[status],
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export function Money({ value, signed = false }: { value: number | null; signed?: boolean }) {
  if (value === null) return <span className="num text-[12px] text-faint">—</span>;
  const tone = value > 0 ? "text-accent" : value < 0 ? "text-danger" : "text-muted-foreground";
  const prefix = signed && value > 0 ? "+" : "";
  return <span className={cn("num text-[12px]", signed && tone)}>{prefix + brl(value)}</span>;
}

export function Percent({ value }: { value: number | null }) {
  if (value === null) return <span className="num text-[12px] text-faint">—</span>;
  const tone = value >= 0 ? "text-accent" : "text-danger";
  return (
    <span className={cn("num text-[12px]", tone)}>
      {(value > 0 ? "+" : "") + pct(value)}
    </span>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="px-4 py-12 text-center">
      <p className="text-[13px] text-muted-foreground">{title}</p>
      {hint && <p className="num mt-1 text-[11px] text-faint">{hint}</p>}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div>
        <h1 className="text-sm font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="num text-[10px] text-faint">{subtitle}</p>}
      </div>
      {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
    </div>
  );
}
