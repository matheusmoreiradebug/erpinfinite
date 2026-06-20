"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ClipboardCheck, Truck, User, Boxes, Loader2, Check, Wrench, ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, Field, inputClass } from "@/components/ui/dialog";
import { cn, formatNumber } from "@/lib/utils";
import type { ReturnRow, QualityCatalogs } from "@/lib/data/quality";
import { classifyReturn, openRework } from "@/app/(app)/qualidade/actions";

export function AnalysisQueue({
  rows,
  photoUrls,
  catalogs,
}: {
  rows: ReturnRow[];
  photoUrls: Record<string, string>;
  catalogs: QualityCatalogs;
}) {
  const router = useRouter();
  const [sel, setSel] = useState<ReturnRow | null>(null);
  const [reasonId, setReasonId] = useState("");
  const [obs, setObs] = useState("");
  const [comRetrabalho, setComRetrabalho] = useState(false);
  const [setorResp, setSetorResp] = useState("");
  const [custoMat, setCustoMat] = useState("");
  const [custoMo, setCustoMo] = useState("");
  const [tempo, setTempo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const abrir = (r: ReturnRow) => {
    setSel(r);
    setReasonId("");
    setObs(r.observacao ?? "");
    setComRetrabalho(false);
    setSetorResp(r.setorId ?? "");
    setCustoMat("");
    setCustoMo("");
    setTempo("");
    setError(null);
  };

  const submit = () => {
    if (!sel) return;
    setError(null);
    startTransition(async () => {
      const res = await classifyReturn(sel.id, {
        reasonId,
        observacao: obs || undefined,
        valorPerdido: sel.valorPerdido,
      });
      if (!res.ok) {
        setError(res.error ?? "Erro ao classificar.");
        return;
      }
      if (comRetrabalho) {
        await openRework({
          returnId: sel.id,
          setorResponsavelId: setorResp || null,
          funcionarioId: sel.funcionarioId,
          custoMaterial: Number(custoMat) || 0,
          custoMaoObra: Number(custoMo) || 0,
          tempoMinutos: Number(tempo) || 0,
        });
      }
      setSel(null);
      router.refresh();
    });
  };

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-success/15 text-success">
            <Check className="size-6" />
          </span>
          <p className="text-sm text-fg-muted">Fila vazia. Todos os retornos foram classificados.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {rows.map((r) => (
          <Card key={r.id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-fg">
                    {r.product} · {formatNumber(r.quantidade)} pç
                  </p>
                  <p className="text-xs text-fg-subtle">
                    {r.data.split("-").reverse().join("/")}
                    {r.hora ? ` · ${r.hora.slice(0, 5)}` : ""}
                    {r.pedido ? ` · pedido ${r.pedido}` : ""}
                  </p>
                </div>
                <Badge variant="warning">{r.status === "registrado" ? "Novo" : "Em análise"}</Badge>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-fg-muted">
                <span className="flex items-center gap-1.5"><Truck className="size-3.5 text-fg-subtle" />{r.truck}</span>
                <span className="flex items-center gap-1.5"><Boxes className="size-3.5 text-fg-subtle" />{r.setor}</span>
                <span className="flex items-center gap-1.5"><User className="size-3.5 text-fg-subtle" />{r.funcionario}</span>
              </div>

              {r.motivoInicial && (
                <p className="mt-3 rounded-lg border border-line bg-panel/60 px-3 py-2 text-xs text-fg-muted">
                  “{r.motivoInicial}”
                </p>
              )}

              {r.fotosPaths.length > 0 && (
                <div className="mt-3 flex gap-2">
                  {r.fotosPaths.slice(0, 4).map((p) =>
                    photoUrls[p] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <a key={p} href={photoUrls[p]} target="_blank" rel="noreferrer">
                        <img
                          src={photoUrls[p]}
                          alt="avaria"
                          className="size-14 rounded-lg border border-line object-cover"
                        />
                      </a>
                    ) : null,
                  )}
                </div>
              )}

              <Button size="sm" className="mt-4 w-full" onClick={() => abrir(r)}>
                <ClipboardCheck className="size-4" />
                Classificar
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog
        open={!!sel}
        onClose={() => setSel(null)}
        title="Classificar retorno"
        description={sel ? `${sel.product} · ${sel.client}` : ""}
      >
        <div className="space-y-3">
          <Field label="Motivo (categoria → motivo)">
            <select value={reasonId} onChange={(e) => setReasonId(e.target.value)} className={inputClass}>
              <option value="">Selecione o motivo…</option>
              {catalogs.categories.map((c) => (
                <optgroup key={c.id} label={c.nome}>
                  {catalogs.reasons
                    .filter((rs) => rs.categoryId === c.id)
                    .map((rs) => (
                      <option key={rs.id} value={rs.id}>
                        {rs.nome}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </Field>
          <Field label="Observação da análise">
            <textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={2} className={cn(inputClass, "h-auto py-2")} />
          </Field>

          {/* retrabalho */}
          <button
            type="button"
            onClick={() => setComRetrabalho((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl border border-line bg-panel/60 px-3 py-2.5 text-sm text-fg transition-colors hover:bg-elevated"
          >
            <span className="flex items-center gap-2">
              <Wrench className="size-4 text-brand-3" />
              Gerou retrabalho?
            </span>
            <ChevronDown className={cn("size-4 text-fg-subtle transition-transform", comRetrabalho && "rotate-180")} />
          </button>

          {comRetrabalho && (
            <div className="space-y-3 rounded-xl border border-line p-3">
              <Field label="Setor responsável">
                <select value={setorResp} onChange={(e) => setSetorResp(e.target.value)} className={inputClass}>
                  <option value="">—</option>
                  {catalogs.sectors.map((s) => (
                    <option key={s.id} value={s.id}>{s.nome}</option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-3 gap-2">
                <Field label="Custo material">
                  <input type="number" min={0} value={custoMat} onChange={(e) => setCustoMat(e.target.value)} placeholder="R$" className={inputClass} />
                </Field>
                <Field label="Custo mão de obra">
                  <input type="number" min={0} value={custoMo} onChange={(e) => setCustoMo(e.target.value)} placeholder="R$" className={inputClass} />
                </Field>
                <Field label="Tempo (min)">
                  <input type="number" min={0} value={tempo} onChange={(e) => setTempo(e.target.value)} placeholder="0" className={inputClass} />
                </Field>
              </div>
            </div>
          )}

          {error && (
            <p className="rounded-xl border border-danger/25 bg-danger/[0.07] px-3 py-2 text-xs text-danger">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" size="sm" onClick={() => setSel(null)}>Cancelar</Button>
            <Button size="sm" onClick={submit} disabled={pending || !reasonId}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Concluir classificação
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
