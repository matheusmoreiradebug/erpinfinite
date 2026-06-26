"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, Wrench, AlertTriangle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, Field, inputClass } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { ReturnRow, QualityCatalogs, Recurrence } from "@/lib/data/quality";
import { GRAVIDADES, DESTINOS, RESPONSAVEIS } from "@/lib/qualidade";
import { classifyReturn, openRework } from "@/app/(app)/qualidade/actions";

export function AnalysisDialog({
  row,
  catalogs,
  recurrence,
  onClose,
  onDone,
}: {
  row: ReturnRow | null;
  catalogs: QualityCatalogs;
  recurrence: Recurrence;
  onClose: () => void;
  onDone: () => void;
}) {
  const [reasonId, setReasonId] = useState("");
  const [gravidade, setGravidade] = useState("");
  const [analise, setAnalise] = useState("");
  const [destino, setDestino] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [acaoPrev, setAcaoPrev] = useState("");
  const [setorResp, setSetorResp] = useState("");
  const [custoMat, setCustoMat] = useState("");
  const [custoMo, setCustoMo] = useState("");
  const [tempo, setTempo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // (re)preenche quando troca o retorno selecionado — suporta edição
  useEffect(() => {
    if (!row) return;
    setReasonId(row.reasonId ?? "");
    setGravidade(row.gravidade ?? "");
    setAnalise(row.analise ?? row.observacao ?? "");
    setDestino(row.destino ?? "");
    setResponsavel(row.responsabilidade ?? "");
    setAcaoPrev(row.acaoPreventiva ?? "");
    setSetorResp(row.setorId ?? "");
    setCustoMat("");
    setCustoMo("");
    setTempo("");
    setError(null);
  }, [row]);

  const editando = row?.status === "classificado" || row?.status === "resolvido";
  const ehRetrabalho = destino === "retrabalho";

  // reincidência (exclui o próprio registro atual)
  const prodCount = row?.productId ? Math.max((recurrence.byProduct[row.productId] ?? 0) - 1, 0) : 0;
  const cliCount = row?.clientId ? Math.max((recurrence.byClient[row.clientId] ?? 0) - 1, 0) : 0;
  const temReincidencia = prodCount > 0 || cliCount > 0;

  const submit = () => {
    if (!row) return;
    setError(null);
    startTransition(async () => {
      const res = await classifyReturn(row.id, {
        reasonId,
        gravidade,
        analise: analise || null,
        destino: destino || null,
        responsabilidade: responsavel || null,
        acaoPreventiva: acaoPrev || null,
        valorPerdido: row.valorPerdido,
      });
      if (!res.ok) {
        setError(res.error ?? "Erro ao classificar.");
        return;
      }
      if (ehRetrabalho) {
        await openRework({
          returnId: row.id,
          setorResponsavelId: setorResp || null,
          funcionarioId: row.funcionarioId,
          custoMaterial: Number(custoMat) || 0,
          custoMaoObra: Number(custoMo) || 0,
          tempoMinutos: Number(tempo) || 0,
        });
      }
      onClose();
      onDone();
    });
  };

  return (
    <Dialog
      open={!!row}
      onClose={onClose}
      wide
      title={editando ? "Editar análise" : "Analisar retorno"}
      description={row ? `${row.product} · ${row.client}` : ""}
    >
      {row && (
        <div className="space-y-4">
          {/* reincidência */}
          {temReincidencia && (
            <div className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/[0.08] px-3 py-2.5 text-xs text-warning">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <div>
                <span className="font-medium">Atenção — reincidência. </span>
                {prodCount > 0 && <>Este produto já teve <b>{prodCount}</b> outro(s) retorno(s) nos últimos meses. </>}
                {cliCount > 0 && <>Este cliente já teve <b>{cliCount}</b> outro(s) retorno(s) no período.</>}
              </div>
            </div>
          )}

          {/* contexto do registro */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-xl border border-line bg-panel/40 px-3 py-2.5 text-xs">
            <Ctx label="Setor de origem" value={row.setor} />
            <Ctx label="Funcionário" value={row.funcionario} />
            <Ctx label="Caminhão" value={row.truck} />
            <Ctx label="Quantidade" value={`${row.quantidade} pç`} />
            {row.motivoInicial && (
              <div className="col-span-2">
                <span className="text-fg-subtle">Relato do almoxarifado: </span>
                <span className="text-fg-muted">“{row.motivoInicial}”</span>
              </div>
            )}
          </div>

          {/* motivo */}
          <Field label="Motivo (categoria → motivo)">
            <select value={reasonId} onChange={(e) => setReasonId(e.target.value)} className={inputClass}>
              <option value="">Selecione o motivo…</option>
              {catalogs.categories.map((c) => (
                <optgroup key={c.id} label={c.nome}>
                  {catalogs.reasons
                    .filter((rs) => rs.categoryId === c.id)
                    .map((rs) => (
                      <option key={rs.id} value={rs.id}>{rs.nome}</option>
                    ))}
                </optgroup>
              ))}
            </select>
          </Field>

          {/* gravidade / risco */}
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-fg-subtle">
              <ShieldAlert className="size-3.5" /> Gravidade / risco
            </p>
            <div className="grid grid-cols-4 gap-2">
              {GRAVIDADES.map((g) => {
                const on = gravidade === g.key;
                return (
                  <button
                    key={g.key}
                    type="button"
                    title={g.desc}
                    onClick={() => setGravidade(g.key)}
                    className={cn(
                      "rounded-xl border px-2 py-2 text-xs font-medium transition-colors",
                      on ? "text-white" : "border-line bg-panel/60 text-fg-muted hover:bg-elevated",
                    )}
                    style={on ? { backgroundColor: g.cor, borderColor: g.cor } : undefined}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
            {gravidade && (
              <p className="mt-1 text-[11px] text-fg-subtle">
                {GRAVIDADES.find((g) => g.key === gravidade)?.desc}
              </p>
            )}
          </div>

          {/* análise: o que aconteceu com a peça */}
          <Field label="Análise — o que aconteceu com a peça">
            <textarea
              value={analise}
              onChange={(e) => setAnalise(e.target.value)}
              rows={4}
              placeholder="Descreva o que foi constatado na inspeção: defeito, extensão do dano, possível causa…"
              className={cn(inputClass, "h-auto py-2 leading-relaxed")}
            />
          </Field>

          {/* destino + responsabilidade */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Destino da peça">
              <select value={destino} onChange={(e) => setDestino(e.target.value)} className={inputClass}>
                <option value="">—</option>
                {DESTINOS.map((d) => (
                  <option key={d.key} value={d.key}>{d.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Responsabilidade">
              <select value={responsavel} onChange={(e) => setResponsavel(e.target.value)} className={inputClass}>
                <option value="">—</option>
                {RESPONSAVEIS.map((r) => (
                  <option key={r.key} value={r.key}>{r.label}</option>
                ))}
              </select>
            </Field>
          </div>

          {/* retrabalho — aparece quando o destino é retrabalho */}
          {ehRetrabalho && (
            <div className="space-y-3 rounded-xl border border-brand/30 bg-brand/[0.05] p-3">
              <p className="flex items-center gap-2 text-xs font-medium text-brand-3">
                <Wrench className="size-4" /> Dados do retrabalho
              </p>
              <Field label="Setor responsável pelo conserto">
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

          {/* ação preventiva */}
          <Field label="Ação preventiva / recomendação" hint="O que fazer para este problema não se repetir.">
            <textarea
              value={acaoPrev}
              onChange={(e) => setAcaoPrev(e.target.value)}
              rows={2}
              placeholder="Ex.: revisar gabarito do setor, reforçar embalagem do produto…"
              className={cn(inputClass, "h-auto py-2")}
            />
          </Field>

          {error && (
            <p className="rounded-xl border border-danger/25 bg-danger/[0.07] px-3 py-2 text-xs text-danger">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" size="sm" onClick={onClose}>Cancelar</Button>
            <Button size="sm" onClick={submit} disabled={pending || !reasonId || !gravidade}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {editando ? "Salvar alterações" : "Concluir análise"}
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}

function Ctx({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-fg-subtle">{label}: </span>
      <span className="font-medium text-fg">{value}</span>
    </div>
  );
}
