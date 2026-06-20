import Link from "next/link";
import {
  ChevronLeft, ChevronRight, TrendingUp, Target, Percent, PackageX, DollarSign, Trophy, Boxes,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { getDashboardData } from "@/lib/data/queries";
import { getQualityDashboard, getReturnsList } from "@/lib/data/quality";
import { businessWeek, formatWeekLabel, addDaysIso } from "@/lib/date-range";
import { formatNumber, formatPercent, formatCurrency, cn, aproveitamentoStatus } from "@/lib/utils";

export default async function FechamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ semana?: string }>;
}) {
  const sp = await searchParams;
  const week = businessWeek(sp.semana);

  const [prod, qual, returns] = await Promise.all([
    getDashboardData(week),
    getQualityDashboard(week),
    getReturnsList({ range: week }),
  ]);

  // top 10 problemas por motivo
  const problemaAgg = new Map<string, number>();
  for (const r of returns) {
    const k = r.motivo ?? "A classificar";
    problemaAgg.set(k, (problemaAgg.get(k) ?? 0) + 1);
  }
  const topProblemas = [...problemaAgg.entries()]
    .map(([motivo, qtd]) => ({ motivo, qtd }))
    .sort((a, b) => b.qtd - a.qtd)
    .slice(0, 10);

  const prevWeek = addDaysIso(week.from, -7);
  const nextWeek = addDaysIso(week.from, 7);

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader title="Fechamento semanal" subtitle={formatWeekLabel(week)}>
        <Link href={`/fechamento?semana=${prevWeek}`}>
          <span className="grid size-9 place-items-center rounded-xl border border-line bg-elevated text-fg-muted hover:bg-line-2 hover:text-fg">
            <ChevronLeft className="size-4" />
          </span>
        </Link>
        <Link href={`/fechamento?semana=${nextWeek}`}>
          <span className="grid size-9 place-items-center rounded-xl border border-line bg-elevated text-fg-muted hover:bg-line-2 hover:text-fg">
            <ChevronRight className="size-4" />
          </span>
        </Link>
      </PageHeader>

      {/* ===== PRODUÇÃO DA SEMANA ===== */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-fg-muted">Produção da semana (seg. a sex.)</h3>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard label="Produção total" value={formatNumber(prod.kpis.producao)} icon={TrendingUp} hint={`${prod.kpis.diasProduzidos} dias`} accent />
          <KpiCard label="Meta semanal" value={formatNumber(prod.kpis.meta)} icon={Target} hint="Soma das metas" />
          <KpiCard label="% atingido" value={formatPercent(prod.kpis.aproveitamento)} icon={Percent} hint="Realizado ÷ meta" />
          <KpiCard label="Melhor dia" value={prod.kpis.melhorDia ? formatNumber(prod.kpis.melhorDia.valor) : "—"} icon={Trophy} hint={prod.kpis.melhorDia?.data ?? ""} />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Ranking dos setores</CardTitle><CardDescription>Realizado × meta</CardDescription></CardHeader>
            <CardContent className="space-y-1">
              {prod.sectorProduction.map((s) => {
                const pct = s.meta ? s.producao / s.meta : 0;
                const st = aproveitamentoStatus(pct);
                return (
                  <div key={s.setor} className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-elevated">
                    <span className="text-sm font-medium text-fg">{s.setor}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-fg-muted">{formatNumber(s.producao)} / {formatNumber(s.meta)}</span>
                      <Badge variant={st === "critico" ? "danger" : st === "alerta" ? "warning" : st === "otimo" ? "success" : "brand"}>
                        {formatPercent(pct)}
                      </Badge>
                    </div>
                  </div>
                );
              })}
              {prod.sectorProduction.length === 0 && <p className="py-4 text-center text-sm text-fg-muted">Sem produção na semana.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Ranking dos funcionários</CardTitle><CardDescription>Top da semana</CardDescription></CardHeader>
            <CardContent className="space-y-1">
              {prod.ranking.slice(0, 7).map((r, i) => (
                <div key={r.nome} className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-elevated">
                  <span className="flex items-center gap-2 text-sm font-medium text-fg">
                    <span className="w-4 text-xs text-fg-subtle">{i + 1}</span>{r.nome}
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-fg">{formatNumber(r.total)}</span>
                </div>
              ))}
              {prod.ranking.length === 0 && <p className="py-4 text-center text-sm text-fg-muted">Sem dados.</p>}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ===== QUALIDADE DA SEMANA ===== */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-fg-muted">Qualidade da semana</h3>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard label="Peças retornadas" value={formatNumber(qual.pecas)} icon={PackageX} hint={`${qual.retornos} devoluções`} />
          <KpiCard label="% de retorno" value={formatPercent(qual.percentRetorno, 1)} icon={Percent} hint="Sobre a produção" />
          <KpiCard label="Valor perdido" value={formatCurrency(qual.valorPerdido)} icon={DollarSign} hint="Estimado" />
          <KpiCard label="Categorias afetadas" value={formatNumber(qual.porCategoria.length)} icon={Boxes} hint="Tipos de problema" />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Top 10 problemas</CardTitle><CardDescription>Motivos mais frequentes</CardDescription></CardHeader>
            <CardContent className="space-y-1">
              {topProblemas.map((p, i) => (
                <div key={p.motivo} className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-elevated">
                  <span className="flex items-center gap-2 text-sm text-fg"><span className="w-4 text-xs text-fg-subtle">{i + 1}</span>{p.motivo}</span>
                  <span className="text-sm font-semibold tabular-nums text-fg">{formatNumber(p.qtd)}</span>
                </div>
              ))}
              {topProblemas.length === 0 && <p className="py-4 text-center text-sm text-fg-muted">Nenhum retorno na semana. 🎉</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Por categoria</CardTitle><CardDescription>Qualidade · logística · entrega · montagem</CardDescription></CardHeader>
            <CardContent className="space-y-1">
              {qual.porCategoria.map((c) => (
                <div key={c.categoria} className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-elevated">
                  <span className="flex items-center gap-2 text-sm text-fg">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: c.cor }} />{c.categoria}
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-fg">{formatNumber(c.ocorrencias)}</span>
                </div>
              ))}
              {qual.porCategoria.length === 0 && <p className="py-4 text-center text-sm text-fg-muted">Sem retornos.</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
