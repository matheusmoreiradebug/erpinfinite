"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  // monta só no cliente para o portal (document indisponível no SSR)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  // renderiza no body — fora de qualquer ancestral com transform (ex.: animate-fade-up),
  // senão o position:fixed se ancora no wrapper e o modal cai no fim da página.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-up"
        onClick={onClose}
      />
      <div className={`relative z-10 my-8 flex max-h-[calc(100dvh-4rem)] w-full flex-col ${wide ? "max-w-xl" : "max-w-md"} animate-fade-up rounded-2xl border border-line bg-ink-2 shadow-2xl`}>
        <div className="flex shrink-0 items-start justify-between border-b border-line p-5">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-fg">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-fg-muted">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="grid size-8 place-items-center rounded-lg text-fg-subtle transition-colors hover:bg-elevated hover:text-fg"
            aria-label="Fechar"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-fg-subtle">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-fg-subtle">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "h-10 w-full rounded-xl border border-line bg-panel px-3 text-sm text-fg placeholder:text-fg-subtle focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/20";
