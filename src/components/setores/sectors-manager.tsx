"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Target, Users, Pencil, Power, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, Field, inputClass } from "@/components/ui/dialog";
import { cn, formatNumber, formatPercent, aproveitamentoStatus } from "@/lib/utils";
import type { SectorDTO } from "@/lib/data/queries";
import { createSector, updateSector, setSectorActive } from "@/app/(app)/setores/actions";

const CORES = ["#2563eb", "#3b82f6", "#60a5fa", "#0ea5e9", "#38bdf8", "#6366f1", "#22c55e", "#f59e0b"];

type SectorProd = { setor: string; producao: number; meta: number };

export function SectorsManager({
  sectors,
  sectorProduction,
  headcount,
}: {
  sectors: SectorDTO[];
  sectorProduction: SectorProd[];
  headcount: Record<string, number>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SectorDTO | null>(null);
  const [nome, setNome] = useState("");
  const [meta, setMeta] = useState("");
  const [metaMes, setMetaMes] = useState("");
  const [cor, setCor] = useState(CORES[0]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const openNew = () => {
    setEditing(null);
    setNome("");
    setMeta("");
    setMetaMes("");
    setCor(CORES[0]);
    setError(null);
    setOpen(true);
  };

  const openEdit = (s: SectorDTO) => {
    setEditing(s);
    setNome(s.nome);
    setMeta(String(s.metaIndividual));
    setMetaMes(s.metaMensal != null ? String(s.metaMensal) : "");
    setCor(s.cor);
    setError(null);
    setOpen(true);
  };

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const input = {
        nome,
        metaIndividual: Number(meta),
        metaMensal: metaMes ? Number(metaMes) : null,
        cor,
      };
      const res = editing ? await updateSector(editing.id, input) : await createSector(input);
      if (res.ok) {
        setOpen(false);
        router.refresh();
      } else {
        setError(res.error ?? "Erro ao salvar.");
      }
    });
  };

  const toggleActive = (s: SectorDTO) => {
    setTogglingId(s.id);
    startTransition(async () => {
      await setSectorActive(s.id, !s.ativo);
      router.refresh();
      setTogglingId(null);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={openNew}>
          <Plus className="size-4" />
          Novo setor
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sectors.map((s) => {
          const prod = sectorProduction.find((p) => p.setor === s.nome);
          const realizado = prod?.producao ?? 0;
          const metaPer = prod?.meta ?? 0;
          const pct = metaPer > 0 ? realizado / metaPer : 0;
          const status = aproveitamentoStatus(pct);
          const pessoas = headcount[s.id] ?? 0;
          const barColor =
            status === "critico"
              ? "bg-danger"
              : status === "alerta"
                ? "bg-warning"
                : status === "otimo"
                  ? "bg-success"
                  : "bg-brand";

          return (
            <Card
              key={s.id}
              className={cn("transition-all hover:border-line-2", !s.ativo && "opacity-60")}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="size-10 shrink-0 rounded-xl" style={{ backgroundColor: s.cor }} />
                    <div>
                      <h3 className="flex items-center gap-2 font-medium text-fg">
                        {s.nome}
                        {!s.ativo && <Badge>Inativo</Badge>}
                      </h3>
                      <p className="text-xs text-fg-subtle">{s.metaIndividual} pç/funcionário</p>
                    </div>
                  </div>
                  {s.ativo && (
                    <Badge
                      variant={
                        status === "critico"
                          ? "danger"
                          : status === "alerta"
                            ? "warning"
                            : status === "otimo"
                              ? "success"
                              : "brand"
                      }
                    >
                      {formatPercent(pct)}
                    </Badge>
                  )}
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-fg-muted">
                    <span>Realizado no período</span>
                    <span className="font-medium text-fg">
                      {formatNumber(realizado)} / {formatNumber(metaPer)}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
                    <div
                      className={cn("h-full rounded-full", barColor)}
                      style={{ width: `${Math.min(pct * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 rounded-xl border border-line bg-panel/60 px-3 py-2">
                    <Users className="size-4 text-brand-3" />
                    <div className="leading-tight">
                      <p className="text-sm font-semibold text-fg">{pessoas}</p>
                      <p className="text-[11px] text-fg-subtle">pessoas</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-line bg-panel/60 px-3 py-2">
                    <Target className="size-4 text-brand-3" />
                    <div className="leading-tight">
                      <p className="text-sm font-semibold text-fg">{s.metaIndividual}</p>
                      <p className="text-[11px] text-fg-subtle">meta/dia</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-1 border-t border-line pt-3">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>
                    <Pencil className="size-3.5" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleActive(s)}
                    disabled={pending && togglingId === s.id}
                    className={cn("ml-auto", s.ativo ? "hover:text-danger" : "hover:text-success")}
                  >
                    {pending && togglingId === s.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Power className="size-3.5" />
                    )}
                    {s.ativo ? "Desativar" : "Ativar"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Editar setor" : "Novo setor"}
        description={editing ? editing.nome : "A meta da equipe é calculada por funcionário × presentes."}
      >
        <div className="space-y-3">
          <Field label="Nome do setor">
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Acabamento"
              autoFocus
              className={inputClass}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Meta por funcionário/dia">
              <input
                type="number"
                min={0}
                value={meta}
                onChange={(e) => setMeta(e.target.value)}
                placeholder="50"
                className={inputClass}
              />
            </Field>
            <Field label="Meta mensal" hint="Opcional">
              <input
                type="number"
                min={0}
                value={metaMes}
                onChange={(e) => setMetaMes(e.target.value)}
                placeholder="—"
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="Cor de identificação">
            <div className="flex flex-wrap items-center gap-2">
              {CORES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCor(c)}
                  className={cn(
                    "size-7 rounded-lg transition-transform",
                    cor === c ? "ring-2 ring-fg ring-offset-2 ring-offset-ink-2" : "hover:scale-110",
                  )}
                  style={{ backgroundColor: c }}
                  aria-label={`Cor ${c}`}
                />
              ))}
            </div>
          </Field>

          {error && (
            <p className="rounded-xl border border-danger/25 bg-danger/[0.07] px-3 py-2 text-xs text-danger">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
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
