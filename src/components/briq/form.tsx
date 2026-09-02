import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-surface/80 p-6 backdrop-blur-sm">
      <div
        className={cn(
          "w-full rounded-lg border border-line bg-panel shadow-xl",
          wide ? "max-w-3xl" : "max-w-xl",
        )}
      >
        <div className="flex h-12 items-center border-b border-line px-4">
          <p className="text-[13px] font-semibold">{title}</p>
          <button
            type="button"
            onClick={onClose}
            className="num ml-auto text-[11px] text-faint hover:text-foreground"
          >
            fechar ✕
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

const baseField =
  "mt-1 h-10 w-full rounded-md border border-line bg-panel2 px-3 text-[13px] outline-none focus:border-accent/50";

export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="label-mono">{label}</span>
      {children}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(baseField, props.className)} />;
}

export function NumberInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="number"
      step="0.01"
      {...props}
      className={cn(baseField, "num", props.className)}
    />
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(baseField, "h-20 resize-none py-2", props.className)}
    />
  );
}

export function Select({
  options,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  options: { value: string; label: string }[];
}) {
  return (
    <select {...props} className={cn(baseField, props.className)}>
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-panel2">
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function SubmitRow({
  label = "Salvar",
  onCancel,
  pending,
}: {
  label?: string;
  onCancel: () => void;
  pending?: boolean;
}) {
  return (
    <div className="mt-5 flex justify-end gap-2">
      <button
        type="button"
        onClick={onCancel}
        className="h-9 rounded-md border border-line px-3 text-[13px] text-muted-foreground"
      >
        Cancelar
      </button>
      <button
        type="submit"
        disabled={pending}
        className="h-9 rounded-md bg-accent px-4 text-[13px] font-semibold text-accent-foreground disabled:opacity-60"
      >
        {label}
      </button>
    </div>
  );
}
