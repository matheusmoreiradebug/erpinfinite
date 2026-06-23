"use client";

import { useState, useTransition } from "react";
import { Loader2, ImageOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { formatNumber, formatCurrency, cn } from "@/lib/utils";
import type { ReturnRow } from "@/lib/data/quality";
import { getReturnPhotos } from "@/app/(app)/qualidade/actions";

const statusVariant = {
  registrado: "warning",
  em_analise: "warning",
  classificado: "brand",
  resolvido: "success",
} as const;

const br = (iso: string) => iso.split("-").reverse().join("/");

export function ReturnsTable({ rows }: { rows: ReturnRow[] }) {
  const [sel, setSel] = useState<ReturnRow | null>(null);
  const [fotos, setFotos] = useState<string[]>([]);
  const [loading, startLoading] = useTransition();

  const abrir = (r: ReturnRow) => {
    setSel(r);
    setFotos([]);
    if (r.fotosPaths.length) {
      startLoading(async () => setFotos(await getReturnPhotos(r.id)));
    }
  };

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
                  <td className="px-4 py-3 text-right tabular-nums text-fg">{formatNumber(r.quantidade)}</td>
                  <td className="px-4 py-3 text-fg-muted">{r.fotosPaths.length || "—"}</td>
                  <td className="px-4 py-3"><Badge variant={statusVariant[r.status]}>{r.status}</Badge></td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-fg-muted">Nenhum retorno encontrado.</td></tr>
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
            {sel.observacao && (
              <div className="rounded-xl border border-line bg-panel/60 px-3 py-2 text-xs text-fg-muted">{sel.observacao}</div>
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
          </div>
        )}
      </Dialog>
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
