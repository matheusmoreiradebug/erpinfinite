"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, CheckCheck, Eraser, Package, Truck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, formatNumber } from "@/lib/utils";
import { linhaLabel } from "@/lib/logistica";
import type { FlowItem, FlowStage } from "@/lib/data/fluxo";
import { markStageBulk } from "@/app/(app)/acompanhamento/actions";

export function FlowMarker({
  listId,
  codigo,
  itens,
  stages,
}: {
  listId: string;
  codigo: string;
  itens: FlowItem[];
  stages: FlowStage[];
}) {
  const router = useRouter();
  const [stageId, setStageId] = useState(stages[0]?.id ?? "");
  const [vals, setVals] = useState<Record<string, number>>(() =>
    Object.fromEntries(itens.map((i) => [i.id, i.progresso[stages[0]?.id ?? ""] ?? 0])),
  );
  const [saving, startSaving] = useTransition();
  const [savedAt, setSavedAt] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finalId = stages.find((s) => s.etapaFinal)?.id ?? null;

  // totais por etapa (a partir do progresso salvo) para o cabeçalho
  const stageTotals = useMemo(() => {
    const t: Record<string, number> = {};
    for (const st of stages) t[st.id] = itens.reduce((a, i) => a + (i.progresso[st.id] ?? 0), 0);
    return t;
  }, [itens, stages]);
  const totalPlanejado = useMemo(() => itens.reduce((a, i) => a + i.quantidade, 0), [itens]);
  const producaoReal = finalId ? stageTotals[finalId] ?? 0 : 0;

  const trocarEtapa = (id: string) => {
    setStageId(id);
    setVals(Object.fromEntries(itens.map((i) => [i.id, i.progresso[id] ?? 0])));
    setSavedAt(false);
    setError(null);
  };

  const setVal = (itemId: string, v: number, max: number) =>
    setVals((prev) => ({ ...prev, [itemId]: Math.max(0, Math.min(Math.floor(v || 0), max)) }));

  const concluirTodos = () => setVals(Object.fromEntries(itens.map((i) => [i.id, i.quantidade])));
  const zerar = () => setVals(Object.fromEntries(itens.map((i) => [i.id, 0])));

  const salvar = () => {
    setError(null);
    startSaving(async () => {
      const res = await markStageBulk(listId, stageId, itens.map((i) => ({ itemId: i.id, quantidade: vals[i.id] ?? 0 })));
      if (!res.ok) { setError(res.error ?? "Erro ao salvar."); return; }
      setSavedAt(true);
      router.refresh();
      setTimeout(() => setSavedAt(false), 2500);
    });
  };

  // agrupa itens por caminhão para exibir
  const grupos = useMemo(() => {
    const m = new Map<string, FlowItem[]>();
    for (const i of itens) {
      const k = i.caminhao ? `Caminhão ${i.caminhao}` : "Sem caminhão";
      (m.get(k) ?? m.set(k, []).get(k)!).push(i);
    }
    return [...m.entries()];
  }, [itens]);

  const marcadoNaEtapa = itens.reduce((a, i) => a + (vals[i.id] ?? 0), 0);

  return (
    <div className="space-y-5">
      {/* resumo */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Resumo label="Planejado" value={totalPlanejado} icon={<Package className="size-4" />} />
        <Resumo label="Produção real" value={producaoReal} accent hint="chegou à expedição" icon={<CheckCheck className="size-4" />} />
        <Resumo label="Itens" value={itens.length} icon={<Package className="size-4" />} />
        <Resumo label="Nesta etapa" value={marcadoNaEtapa} icon={<Check className="size-4" />} />
      </div>

      {/* etapas */}
      <div className="flex flex-wrap gap-2">
        {stages.map((st) => (
          <button
            key={st.id}
            type="button"
            onClick={() => trocarEtapa(st.id)}
            className={cn(
              "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
              stageId === st.id ? "border-brand bg-brand/10 text-fg" : "border-line bg-panel/60 text-fg-muted hover:bg-elevated",
            )}
          >
            <span className="size-2 rounded-full" style={{ backgroundColor: st.cor }} />
            {st.nome}
            {st.etapaFinal && <span className="text-[10px] uppercase text-success">final</span>}
            <span className="rounded-md bg-elevated px-1.5 py-0.5 text-[11px] tabular-nums text-fg-subtle">
              {formatNumber(stageTotals[st.id] ?? 0)}
            </span>
          </button>
        ))}
      </div>

      {/* ações rápidas */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" onClick={concluirTodos}><CheckCheck className="size-4" /> Concluir todos</Button>
        <Button variant="secondary" size="sm" onClick={zerar}><Eraser className="size-4" /> Zerar</Button>
        <span className="text-xs text-fg-subtle">Ajuste as quantidades que a etapa concluiu e salve.</span>
      </div>

      {/* itens por caminhão */}
      <div className="space-y-4">
        {grupos.map(([grupo, its]) => (
          <Card key={grupo}>
            <CardContent className="p-0">
              <div className="flex items-center gap-2 border-b border-line px-4 py-2.5 text-sm font-medium text-fg">
                <Truck className="size-4 text-brand-3" /> {grupo}
                <span className="text-xs font-normal text-fg-subtle">· {its.length} itens</span>
              </div>
              <ul className="divide-y divide-line/60">
                {its.map((i) => {
                  const v = vals[i.id] ?? 0;
                  const full = v >= i.quantidade;
                  return (
                    <li key={i.id} className="flex items-center gap-3 px-4 py-2">
                      <span className={cn("size-2 shrink-0 rounded-full", i.cor === "branco" ? "bg-fg-subtle" : "bg-ink-3 ring-1 ring-line")} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-fg">{i.movel}</p>
                        <p className="text-[11px] text-fg-subtle">{linhaLabel(i.linha)} · {i.cor} · meta {formatNumber(i.quantidade)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setVal(i.id, full ? 0 : i.quantidade, i.quantidade)}
                        className={cn("grid size-8 shrink-0 place-items-center rounded-lg border transition-colors",
                          full ? "border-success/40 bg-success/15 text-success" : "border-line text-fg-subtle hover:bg-elevated")}
                        aria-label="Concluir item"
                      >
                        <Check className="size-4" />
                      </button>
                      <input
                        type="number"
                        min={0}
                        max={i.quantidade}
                        value={v}
                        onChange={(e) => setVal(i.id, Number(e.target.value), i.quantidade)}
                        className="h-9 w-16 shrink-0 rounded-lg border border-line bg-panel px-2 text-center text-sm tabular-nums text-fg focus:border-brand/50 focus:outline-none"
                      />
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {error && <p className="rounded-xl border border-danger/25 bg-danger/[0.07] px-3 py-2 text-sm text-danger">{error}</p>}

      {/* barra de salvar */}
      <div className="sticky bottom-4 flex items-center justify-between rounded-2xl border border-line bg-ink-2/95 px-4 py-3 shadow-xl backdrop-blur">
        <p className="text-sm text-fg-muted">
          <span className="font-medium text-fg">{codigo}</span> · etapa <span className="font-medium text-fg">{stages.find((s) => s.id === stageId)?.nome}</span>
        </p>
        <Button onClick={salvar} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : savedAt ? <Check className="size-4" /> : <Check className="size-4" />}
          {savedAt ? "Salvo" : "Salvar etapa"}
        </Button>
      </div>
    </div>
  );
}

function Resumo({ label, value, icon, accent, hint }: { label: string; value: number; icon: React.ReactNode; accent?: boolean; hint?: string }) {
  return (
    <div className={cn("rounded-xl border p-3", accent ? "border-brand/30 bg-brand/[0.06]" : "border-line bg-panel/60")}>
      <span className="flex items-center gap-1.5 text-xs text-fg-subtle">{icon}{label}</span>
      <p className={cn("mt-1 text-2xl font-semibold tabular-nums", accent ? "text-brand-3" : "text-fg")}>{formatNumber(value)}</p>
      {hint && <p className="text-[10px] text-fg-subtle">{hint}</p>}
    </div>
  );
}
