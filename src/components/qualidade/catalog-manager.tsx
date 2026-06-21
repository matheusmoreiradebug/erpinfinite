"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Power, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, Field, inputClass } from "@/components/ui/dialog";
import { cn, formatCurrency } from "@/lib/utils";
import { saveCatalog, toggleCatalogActive, type CatalogType } from "@/app/(app)/qualidade/catalogos/actions";

export type CatalogField = {
  key: string;
  label: string;
  type?: "text" | "number" | "select" | "color";
  options?: { value: string; label: string }[];
  required?: boolean;
  hint?: string;
  placeholder?: string;
};

type Item = Record<string, unknown> & { id: string; ativo: boolean };

export function CatalogManager({
  type,
  novoLabel,
  fields,
  items,
}: {
  type: CatalogType;
  novoLabel: string;
  fields: CatalogField[];
  items: Item[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const openNew = () => {
    setEditing(null);
    const init: Record<string, string> = {};
    for (const f of fields) init[f.key] = f.type === "color" ? "#2563eb" : "";
    setForm(init);
    setError(null);
    setOpen(true);
  };

  const openEdit = (it: Item) => {
    setEditing(it);
    const init: Record<string, string> = {};
    for (const f of fields) init[f.key] = it[f.key] != null ? String(it[f.key]) : "";
    setForm(init);
    setError(null);
    setOpen(true);
  };

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const data = { ...form };
      if (editing) data.id = editing.id;
      const res = await saveCatalog(type, data);
      if (res.ok) {
        setOpen(false);
        router.refresh();
      } else setError(res.error ?? "Erro ao salvar.");
    });
  };

  const toggle = (it: Item) => {
    setTogglingId(it.id);
    startTransition(async () => {
      await toggleCatalogActive(type, it.id, !it.ativo);
      router.refresh();
      setTogglingId(null);
    });
  };

  const renderValue = (it: Item, f: CatalogField) => {
    const v = it[f.key];
    if (f.type === "color") return <span className="inline-block size-4 rounded" style={{ backgroundColor: String(v) }} />;
    if (f.key === "custo_unitario") return v ? formatCurrency(Number(v)) : "—";
    if (f.type === "select") return f.options?.find((o) => o.value === v)?.label ?? "—";
    return v ? String(v) : <span className="text-fg-subtle">—</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={openNew}>
          <Plus className="size-4" />
          {novoLabel}
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs font-medium uppercase tracking-wide text-fg-subtle">
                {fields.map((f) => (
                  <th key={f.key} className="px-4 py-3 font-medium">{f.label}</th>
                ))}
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className={cn("border-b border-line/60 transition-colors last:border-0 hover:bg-elevated/50", !it.ativo && "opacity-55")}>
                  {fields.map((f, idx) => (
                    <td key={f.key} className={cn("px-4 py-3", idx === 0 ? "font-medium text-fg" : "text-fg-muted")}>
                      {renderValue(it, f)}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-xs text-fg-muted">
                      <span className={cn("size-1.5 rounded-full", it.ativo ? "bg-success" : "bg-fg-subtle")} />
                      {it.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(it)}><Pencil className="size-3.5" />Editar</Button>
                      <Button variant="ghost" size="sm" onClick={() => toggle(it)} disabled={pending && togglingId === it.id} className={it.ativo ? "hover:text-danger" : "hover:text-success"}>
                        {pending && togglingId === it.id ? <Loader2 className="size-3.5 animate-spin" /> : <Power className="size-3.5" />}
                        {it.ativo ? "Desativar" : "Ativar"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={fields.length + 2} className="px-4 py-10 text-center text-sm text-fg-muted">Nenhum item cadastrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} title={editing ? `Editar ${novoLabel.replace(/^Novo[a]?\s/i, "")}` : novoLabel}>
        <div className="space-y-3">
          {fields.map((f) => (
            <Field key={f.key} label={f.label} hint={f.hint}>
              {f.type === "select" ? (
                <select value={form[f.key] ?? ""} onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))} className={inputClass}>
                  <option value="">Selecione…</option>
                  {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : f.type === "color" ? (
                <input type="color" value={form[f.key] || "#2563eb"} onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))} className="h-10 w-16 cursor-pointer rounded-xl border border-line bg-panel" />
              ) : (
                <input
                  type={f.type === "number" ? "number" : "text"}
                  value={form[f.key] ?? ""}
                  onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className={inputClass}
                />
              )}
            </Field>
          ))}

          {error && <p className="rounded-xl border border-danger/25 bg-danger/[0.07] px-3 py-2 text-xs text-danger">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={submit} disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {editing ? "Salvar" : "Cadastrar"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
