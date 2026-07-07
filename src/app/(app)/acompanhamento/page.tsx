import Link from "next/link";
import { ListChecks, ChevronRight, PackageCheck } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { getActiveFlowLists } from "@/lib/data/fluxo";
import { statusLabel, statusCor } from "@/lib/logistica";
import { formatNumber, formatPercent } from "@/lib/utils";

export default async function AcompanhamentoPage() {
  const lists = await getActiveFlowLists();

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader title="Acompanhamento de produção" subtitle="Avance os itens de cada lista pelas etapas. A produção real conta na expedição." />

      {lists.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-brand/15 text-brand-3"><PackageCheck className="size-6" /></span>
            <p className="text-sm text-fg-muted">Nenhuma lista em produção. Importe ou crie uma lista em Logística.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {lists.map((l) => (
            <Link key={l.id} href={`/acompanhamento/${l.id}`}>
              <Card className="transition-colors hover:border-line-2">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="flex items-center gap-2 text-sm font-semibold text-fg">
                        <ListChecks className="size-4 text-brand-3" /> {l.codigo}
                      </p>
                      <p className="mt-0.5 text-xs text-fg-subtle">
                        Produção {l.dataProducao.split("-").reverse().join("/")}
                        <span className="ml-2 rounded-md px-1.5 py-0.5" style={{ backgroundColor: statusCor(l.status) + "22", color: statusCor(l.status) }}>
                          {statusLabel(l.status)}
                        </span>
                      </p>
                    </div>
                    <ChevronRight className="size-4 text-fg-subtle" />
                  </div>

                  <div className="mt-3">
                    <div className="mb-1 flex items-baseline justify-between text-xs">
                      <span className="text-fg-muted">Produzido (expedição)</span>
                      <span className="font-semibold tabular-nums text-fg">
                        {formatNumber(l.produzido)} / {formatNumber(l.totalPecas)} <span className="text-fg-subtle">({formatPercent(l.pct, 0)})</span>
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-line">
                      <div className="h-full rounded-full bg-gradient-to-r from-brand to-brand-3" style={{ width: `${Math.min(l.pct * 100, 100)}%` }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
