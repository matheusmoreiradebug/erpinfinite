import { PackageCheck, Factory, Layers, GitBranch } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { PeriodPicker } from "@/components/ui/period-picker";
import { getFlowProduction } from "@/lib/data/fluxo";
import { parseRange, formatRangeLabel } from "@/lib/date-range";
import { formatNumber, formatPercent, cn } from "@/lib/utils";

export default async function ProducaoFluxoPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const range = parseRange(await searchParams);
  const d = await getFlowProduction(range);
  const pct = d.totalPlanejado ? d.producaoReal / d.totalPlanejado : 0;
  const maxSetor = Math.max(...d.porSetor.map((s) => s.quantidade), 1);

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader title="Produção (fluxo)" subtitle={`Contagem por peça, sem duplicar · ${formatRangeLabel(range)}`}>
        <PeriodPicker range={range} />
      </PageHeader>

      <div className="flex items-start gap-3 rounded-xl border border-brand/25 bg-brand/[0.05] px-4 py-3 text-sm text-fg-muted">
        <GitBranch className="mt-0.5 size-4 shrink-0 text-brand-3" />
        <p>
          A <span className="font-medium text-fg">produção real</span> conta cada peça <span className="font-medium text-fg">uma única vez</span>, quando chega à expedição.
          Os números por setor são <span className="font-medium text-fg">produtividade</span> (quantas peças cada etapa tocou) e <span className="font-medium text-fg">nunca são somados</span> no total.
        </p>
      </div>

      {d.semVazio && (
        <div className="rounded-xl border border-line bg-panel/60 px-4 py-3 text-sm text-fg-muted">
          Nenhuma marcação de etapa no período. Avance as listas em Acompanhamento de produção.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Produção real" value={formatNumber(d.producaoReal)} icon={PackageCheck} hint="Peças na expedição" accent />
        <KpiCard label="Planejado" value={formatNumber(d.totalPlanejado)} icon={Layers} hint={`${d.listas} lista(s)`} />
        <KpiCard label="Concluído" value={formatPercent(pct, 0)} icon={Factory} hint="Real ÷ planejado" />
        <KpiCard label="Em processo" value={formatNumber(Math.max(d.totalPlanejado - d.producaoReal, 0))} icon={Layers} hint="Ainda não expedido" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Produtividade por setor</CardTitle>
          <CardDescription>Peças que cada etapa concluiu no período — medida de trabalho, não de saída</CardDescription>
        </CardHeader>
        <CardContent>
          {d.porSetor.every((s) => s.quantidade === 0) ? (
            <p className="py-8 text-center text-sm text-fg-muted">Sem marcações no período.</p>
          ) : (
            <div className="space-y-4">
              {d.porSetor.map((s) => (
                <div key={s.setor}>
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <span className="flex items-center gap-2 text-sm font-medium text-fg">
                      <span className="size-2.5 rounded-full" style={{ backgroundColor: s.cor }} />
                      {s.setor}
                      {s.etapaFinal && <span className="rounded-md bg-success/15 px-1.5 py-0.5 text-[10px] uppercase text-success">produção real</span>}
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-fg">{formatNumber(s.quantidade)}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-line">
                    <div
                      className={cn("h-full rounded-full", s.etapaFinal ? "bg-success" : "bg-gradient-to-r from-brand to-brand-3")}
                      style={{ width: `${(s.quantidade / maxSetor) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
