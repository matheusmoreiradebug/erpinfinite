"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Plus, Trash2, Truck, Save, Check, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/dialog";
import { cn, formatNumber } from "@/lib/utils";
import { LINHAS, CAMINHOES, type LoadingItem, type Cor } from "@/lib/logistica";
import { saveLoadingDay } from "@/app/(app)/logistica/actions";

type Row = { key: string; caminhao: number; cor: Cor; movel: string; quantidade: string };
let counter = 0;
const newKey = () => `r${counter++}`;

export function LoadingForm({
  data,
  linha,
  initial,
  sugestoes,
}: {
  data: string;
  linha: string;
  initial: LoadingItem[];
  sugestoes: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [rows, setRows] = useState<Row[]>(
    initial.map((i) => ({
      key: newKey(),
      caminhao: i.caminhao,
      cor: i.cor,
      movel: i.movel,
      quantidade: String(i.quantidade),
    })),
  );
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const navParam = (key: string, value: string) => {
    const params = new URLSearchParams(sp.toString());
    params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  };

  const addRow = (caminhao: number) =>
    setRows((rs) => [...rs, { key: newKey(), caminhao, cor: "branco", movel: "", quantidade: "" }]);
  const update = (key: string, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const remove = (key: string) => setRows((rs) => rs.filter((r) => r.key !== key));

  const total = rows.reduce((a, r) => a + (Number(r.quantidade) || 0), 0);
  const branco = rows.filter((r) => r.cor === "branco").reduce((a, r) => a + (Number(r.quantidade) || 0), 0);
  const preto = total - branco;

  const salvar = () => {
    setError(null);
    const itens: LoadingItem[] = rows
      .filter((r) => r.movel.trim() && Number(r.quantidade) > 0)
      .map((r) => ({ caminhao: r.caminhao, cor: r.cor, movel: r.movel.trim(), quantidade: Number(r.quantidade) }));
    startTransition(async () => {
      const res = await saveLoadingDay(data, linha, itens);
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2400);
        router.refresh();
      } else setError(res.error ?? "Erro ao salvar.");
    });
  };

  return (
    <div className="space-y-4">
      <datalist id="moveis-sugestoes">
        {sugestoes.map((s) => <option key={s} value={s} />)}
      </datalist>

      {/* controles: data + linha */}
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-fg-subtle">Data</span>
          <input
            type="date"
            value={data}
            onChange={(e) => navParam("data", e.target.value)}
            className="h-10 rounded-xl border border-line bg-panel px-3 text-sm text-fg focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {LINHAS.map((l) => (
            <button
              key={l.key}
              onClick={() => navParam("linha", l.key)}
              className={cn(
                "rounded-xl border px-3 py-2 text-sm font-medium transition-all",
                l.key === linha ? "border-brand bg-brand/15 text-fg" : "border-line text-fg-muted hover:bg-elevated hover:text-fg",
              )}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* caminhões */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {CAMINHOES.map((cam) => {
          const itens = rows.filter((r) => r.caminhao === cam);
          const totalCam = itens.reduce((a, r) => a + (Number(r.quantidade) || 0), 0);
          return (
            <Card key={cam}>
              <CardContent className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium text-fg">
                    <Truck className="size-4 text-brand-3" /> Caminhão {cam}
                  </span>
                  <span className="text-xs text-fg-subtle">{formatNumber(totalCam)} pç</span>
                </div>

                <div className="space-y-2">
                  {itens.map((r) => (
                    <div key={r.key} className="grid grid-cols-[1fr_88px_64px_32px] items-center gap-2">
                      <input
                        list="moveis-sugestoes"
                        value={r.movel}
                        onChange={(e) => update(r.key, { movel: e.target.value })}
                        placeholder="Móvel"
                        className={cn(inputClass, "h-9")}
                      />
                      <div className="flex rounded-lg border border-line p-0.5">
                        {(["branco", "preto"] as const).map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => update(r.key, { cor: c })}
                            className={cn(
                              "flex-1 rounded-md py-1 text-[11px] font-medium capitalize transition-colors",
                              r.cor === c
                                ? c === "branco" ? "bg-fg text-ink" : "bg-ink-2 text-fg ring-1 ring-line-2"
                                : "text-fg-subtle hover:text-fg",
                            )}
                          >
                            {c === "branco" ? "Branco" : "Preto"}
                          </button>
                        ))}
                      </div>
                      <input
                        type="number"
                        min={1}
                        value={r.quantidade}
                        onChange={(e) => update(r.key, { quantidade: e.target.value.replace(/\D/g, "") })}
                        placeholder="Qtd"
                        className={cn(inputClass, "h-9 px-2 text-center")}
                      />
                      <button
                        onClick={() => remove(r.key)}
                        className="grid size-8 place-items-center rounded-lg text-fg-subtle hover:bg-danger/15 hover:text-danger"
                        aria-label="Remover"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => addRow(cam)}
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-line py-2 text-xs font-medium text-fg-muted transition-colors hover:border-brand/40 hover:text-fg"
                >
                  <Plus className="size-3.5" /> Adicionar móvel
                </button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* rodapé: totais + salvar */}
      <Card className="sticky bottom-4 z-10">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex gap-5 text-sm">
            <span className="text-fg-muted">Branco: <b className="text-fg">{formatNumber(branco)}</b></span>
            <span className="text-fg-muted">Preto: <b className="text-fg">{formatNumber(preto)}</b></span>
            <span className="text-fg-muted">Total: <b className="text-fg">{formatNumber(total)}</b></span>
          </div>
          <div className="flex items-center gap-3">
            {error && <span className="text-xs text-danger">{error}</span>}
            <Button onClick={salvar} disabled={pending}>
              {pending ? <><Loader2 className="size-4 animate-spin" /> Salvando…</> : saved ? <><Check className="size-4" /> Lista salva</> : <><Save className="size-4" /> Salvar lista</>}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
