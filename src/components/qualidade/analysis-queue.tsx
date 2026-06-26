"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardCheck, Truck, User, Boxes, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";
import type { ReturnRow, QualityCatalogs, Recurrence } from "@/lib/data/quality";
import { AnalysisDialog } from "@/components/qualidade/analysis-dialog";

export function AnalysisQueue({
  rows,
  photoUrls,
  catalogs,
  recurrence,
}: {
  rows: ReturnRow[];
  photoUrls: Record<string, string>;
  catalogs: QualityCatalogs;
  recurrence: Recurrence;
}) {
  const router = useRouter();
  const [sel, setSel] = useState<ReturnRow | null>(null);

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-success/15 text-success">
            <Check className="size-6" />
          </span>
          <p className="text-sm text-fg-muted">Fila vazia. Todos os retornos foram analisados.</p>
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

              <Button size="sm" className="mt-4 w-full" onClick={() => setSel(r)}>
                <ClipboardCheck className="size-4" />
                Analisar e classificar
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <AnalysisDialog
        row={sel}
        catalogs={catalogs}
        recurrence={recurrence}
        onClose={() => setSel(null)}
        onDone={() => router.refresh()}
      />
    </>
  );
}
