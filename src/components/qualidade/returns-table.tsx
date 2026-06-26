"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ImageOff, Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { formatNumber, formatCurrency, cn } from "@/lib/utils";
import type { ReturnRow, QualityCatalogs, Recurrence } from "@/lib/data/quality";
import { gravidadeLabel, gravidadeCor, destinoLabel, responsavelLabel } from "@/lib/qualidade";
import { getReturnPhotos } from "@/app/(app)/qualidade/actions";
import { AnalysisDialog } from "@/components/qualidade/analysis-dialog";

const statusVariant = {
  registrado: "warning",
  em_analise: "warning",
  classificado: "brand",
  resolvido: "success",
} as const;

const br = (iso: string) => iso.split("-").reverse().join("/");

export function ReturnsTable({
  rows,
  catalogs,
  recurrence,
  canEdit,
}: {
  rows: ReturnRow[];
  catalogs?: QualityCatalogs;
  recurrence?: Recurrence;
  canEdit?: boolean;
}) {
  const router = useRouter();
  const [sel, setSel] = useState<ReturnRow | null>(null);
  const [editar, setEditar] = useState<ReturnRow | null>(null);
  const [fotos, setFotos] = useState<string[]>([]);
  const [loading, startLoading] = useTransition();

  const abrir = (r: ReturnRow) => {
    setSel(r);
    setFotos([]);
    if (r.fotosPaths.length) {
      startLoading(async () => setFotos(await getReturnPhotos(r.id)));
    }
  };

  const podeEditar = canEdit && catalogs && recurrence;

  return (
    <>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs font-medium uppercase tracking-wide text-fg-subtle">
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Produto</th>
                <th className="px-4 py-3 font-medium">Caminhão</th>
                <th className="px-4 py-3 font-medium">Setor</th>
                <th className="px-4 py-3 font-medium">Motivo</th>
                <th className="px-4 py-3 font-medium">Gravidade</th>
                <th className="px-4 py-3 text-right font-medium">Qtd</th>
                <th className="px-4 py-3 font-medium">Fotos</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => abrir(r)}
                  className="cursor-pointer border-b border-line/60 transition-colors last:border-0 hover:bg-elevated/50"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-fg-muted">{br(r.data)}</td>
                  <td className="px-4 py-3 font-medium text-fg">{r.product}</td>
                  <td className="px-4 py-3 text-fg-muted">{r.truck}</td>
                  <td className="px-4 py-3 text-fg-muted">{r.setor}</td>
                  <td className="px-4 py-3 text-fg-muted">
                    {r.motivo ? (
                      <span>{r.categoria && <span className="text-fg-subtle">{r.categoria} · </span>}{r.motivo}</span>
                    ) : (
                      <span className="text-fg-subtle">— a classificar —</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {r.gravidade ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-fg-muted">
                        <span className="size-2 rounded-full" style={{ backgroundColor: gravidadeCor(r.gravidade) }} />
                        {gravidadeLabel(r.gravidade)}
                      </span>
                    ) : (
                      <span className="text-fg-subtle">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-fg">{formatNumber(r.quantidade)}</td>
                  <td className="px-4 py-3 text-fg-muted">{r.fotosPaths.length || "—"}</td>
                  <td className="px-4 py-3"><Badge variant={statusVariant[r.status]}>{r.status}</Badge></td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-sm text-fg-muted">Nenhum retorno encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={!!sel} onClose={() => setSel(null)} title="Detalhe do retorno" description={sel ? `${sel.product} · ${sel.client}` : ""}>
        {sel && (
          <div className="space-y-4">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <Info label="Data / hora" value={`${br(sel.data)}${sel.hora ? " · " + sel.hora.slice(0, 5) : ""}`} />
              <Info label="Pedido" value={sel.pedido ?? "—"} />
              <Info label="Caminhão" value={sel.truck} />
              <Info label="Cliente" value={sel.client} />
              <Info label="Setor de origem" value={sel.setor} />
              <Info label="Funcionário" value={sel.funcionario} />
              <Info label="Quantidade" value={`${formatNumber(sel.quantidade)} pç`} />
              <Info label="Valor perdido" value={sel.valorPerdido ? formatCurrency(sel.valorPerdido) : "—"} />
              <Info label="Motivo (registro)" value={sel.motivoInicial ?? "—"} />
              <Info label="Classificação" value={sel.motivo ? `${sel.categoria} · ${sel.motivo}` : "a classificar"} />
            </dl>

            {/* ficha de análise */}
            {(sel.gravidade || sel.destino || sel.responsabilidade || sel.analise || sel.acaoPreventiva) && (
              <div className="space-y-2.5 rounded-xl border border-line bg-panel/40 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">Análise da qualidade</p>
                <div className="flex flex-wrap gap-2">
                  {sel.gravidade && (
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-white" style={{ backgroundColor: gravidadeCor(sel.gravidade) }}>
                      {gravidadeLabel(sel.gravidade)}
                    </span>
                  )}
                  {sel.destino && <Chip label="Destino" value={destinoLabel(sel.destino)!} />}
                  {sel.responsabilidade && <Chip label="Responsável" value={responsavelLabel(sel.responsabilidade)!} />}
                </div>
                {sel.analise && (
                  <div>
                    <p className="text-[11px] text-fg-subtle">O que aconteceu</p>
                    <p className="text-sm text-fg-muted">{sel.analise}</p>
                  </div>
                )}
                {sel.acaoPreventiva && (
                  <div>
                    <p className="text-[11px] text-fg-subtle">Ação preventiva</p>
                    <p className="text-sm text-fg-muted">{sel.acaoPreventiva}</p>
                  </div>
                )}
              </div>
            )}

            <div>
              <p className="mb-2 text-xs font-medium text-fg-subtle">Fotos da avaria</p>
              {sel.fotosPaths.length === 0 ? (
                <p className="flex items-center gap-2 text-sm text-fg-subtle"><ImageOff className="size-4" /> Sem fotos.</p>
              ) : loading ? (
                <p className="flex items-center gap-2 text-sm text-fg-muted"><Loader2 className="size-4 animate-spin" /> Carregando…</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {fotos.map((u, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <a key={i} href={u} target="_blank" rel="noreferrer">
                      <img src={u} alt="avaria" className="size-24 rounded-lg border border-line object-cover" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {podeEditar && (
              <div className="flex justify-end border-t border-line pt-3">
                <Button size="sm" variant="secondary" onClick={() => { const r = sel; setSel(null); setEditar(r); }}>
                  <Pencil className="size-4" />
                  {sel.status === "registrado" || sel.status === "em_analise" ? "Analisar" : "Editar análise"}
                </Button>
              </div>
            )}
          </div>
        )}
      </Dialog>

      {podeEditar && (
        <AnalysisDialog
          row={editar}
          catalogs={catalogs!}
          recurrence={recurrence!}
          onClose={() => setEditar(null)}
          onDone={() => router.refresh()}
        />
      )}
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] text-fg-subtle">{label}</dt>
      <dd className={cn("font-medium text-fg")}>{value}</dd>
    </div>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-line bg-elevated px-2.5 py-1 text-xs">
      <span className="text-fg-subtle">{label}:</span>
      <span className="font-medium text-fg">{value}</span>
    </span>
  );
}
