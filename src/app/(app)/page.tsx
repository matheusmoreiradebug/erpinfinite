import {
  TrendingUp,
  Target,
  Percent,
  Users,
  Boxes,
  Trophy,
  Sparkles,
  AlertTriangle,
  Gauge,
  CalendarCheck,
  Award,
  FileText,
  FileSpreadsheet,
  Layers,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { DailyProductionChart, SectorProductionChart } from "@/components/dashboard/charts";
import { RankingList } from "@/components/dashboard/ranking-list";
import { AlertsPanel } from "@/components/dashboard/alerts-panel";
import { PeriodPicker } from "@/components/ui/period-picker";
import { getDashboardData } from "@/lib/data/queries";
import { parseRange, formatRangeLabel } from "@/lib/date-range";
import { formatNumber, formatPercent } from "@/lib/utils";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const range = parseRange(sp);
  const { kpis, dailyProduction, sectorProduction, ranking, alerts, insights, chapas } =
    await getDashboardData(range);

  const vazio = kpis.diasProduzidos === 0;

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader title="Visão geral" subtitle={`Produção · ${formatRangeLabel(range)}`}>
        <PeriodPicker range={range} />
        <a href={`/api/export?type=completo&format=csv&from=${range.from}&to=${range.to}`}>
          <span className="inline-flex h-9 items-center gap-2 rounded-xl border border-line bg-elevated px-3 text-sm font-medium text-fg transition-colors hover:bg-line-2">
            <FileSpreadsheet className="size-4" />
            CSV
          </span>
        </a>
        <a href={`/api/export?type=completo&format=pdf&from=${range.from}&to=${range.to}`}>
          <span className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-medium text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.6)] transition-colors hover:bg-brand-2">
            <FileText className="size-4" />
            PDF
          </span>
        </a>
      </PageHeader>

      {vazio && (
        <div className="flex items-center gap-3 rounded-xl border border-line bg-panel/60 px-4 py-3 text-sm text-fg-muted">
          <CalendarCheck className="size-4 text-fg-subtle" />
          Nenhuma produção lançada neste período. Ajuste o filtro de data acima.
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Produção no período"
          value={formatNumber(kpis.producao)}
          icon={TrendingUp}
          hint={`Meta: ${formatNumber(kpis.meta)} peças`}
          accent
        />
        <KpiCard
          label="Meta atingida"
          value={formatPercent(kpis.aproveitamento)}
          icon={Percent}
          hint="Realizado ÷ meta da equipe"
        />
        <KpiCard
          label="Média por dia"
          value={formatNumber(kpis.mediaDia)}
          icon={Gauge}
          hint={`${kpis.diasProduzidos} dia(s) com produção`}
        />
        <KpiCard
          label="Melhor dia"
          value={kpis.melhorDia ? formatNumber(kpis.melhorDia.valor) : "—"}
          icon={Award}
          hint={kpis.melhorDia ? `em ${kpis.melhorDia.data}` : "sem dados"}
        />
        <KpiCard
          label="Meta do período"
          value={formatNumber(kpis.meta)}
          icon={Target}
          hint="Soma das metas diárias"
        />
        <KpiCard
          label="Funcionários ativos"
          value={formatNumber(kpis.funcionariosAtivos)}
          icon={Users}
          hint="Produziram no período"
        />
        <KpiCard
          label="Setores ativos"
          value={formatNumber(kpis.setoresAtivos)}
          icon={Boxes}
          hint="Com lançamento no período"
        />
        <KpiCard
          label="Dias produzidos"
          value={formatNumber(kpis.diasProduzidos)}
          icon={CalendarCheck}
          hint="Dias com lançamento"
        />
      </div>

      {/* gráficos */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Produção diária × meta</CardTitle>
              <CardDescription>Evolução no período selecionado</CardDescription>
            </div>
            <Badge variant="brand">
              <span className="size-1.5 rounded-full bg-brand-3" />
              {formatRangeLabel(range)}
            </Badge>
          </CardHeader>
          <CardContent>
            <DailyProductionChart data={dailyProduction} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Produção por setor</CardTitle>
            <CardDescription>Realizado × meta no período</CardDescription>
          </CardHeader>
          <CardContent>
            <SectorProductionChart data={sectorProduction} />
          </CardContent>
        </Card>
      </div>

      {/* ranking + alertas + IA */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Ranking de produtividade</CardTitle>
              <CardDescription>Top funcionários no período</CardDescription>
            </div>
            <Trophy className="size-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <RankingList ranking={ranking} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Alertas automáticos</CardTitle>
              <CardDescription>Setores que precisam de atenção</CardDescription>
            </div>
            <AlertTriangle className="size-4 text-warning" />
          </CardHeader>
          <CardContent>
            <AlertsPanel alerts={alerts} />
          </CardContent>
        </Card>

        <Card className="border-brand/20 bg-brand/[0.04]">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="size-4 text-brand-3" />
                Assistente inteligente
              </CardTitle>
              <CardDescription>Insights gerados sobre os dados</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.map((ins) => (
              <div key={ins.id} className="rounded-xl border border-line bg-panel/60 p-3">
                <p className="text-xs font-medium text-brand-3">{ins.titulo}</p>
                <p className="mt-1 text-xs leading-relaxed text-fg-muted">{ins.texto}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ===== PRODUÇÃO EM CHAPAS (setor Fita) — unidade separada ===== */}
      {chapas && (
        <div className="space-y-4 border-t border-line pt-5">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-xl" style={{ backgroundColor: "#a855f733", color: "#a855f7" }}>
              <Layers className="size-4" />
            </span>
            <div>
              <h3 className="text-sm font-medium text-fg">Produção em chapas — Fita</h3>
              <p className="text-xs text-fg-subtle">Unidade própria — nunca somada às peças</p>
            </div>
          </div>

          {chapas.producao === 0 ? (
            <Card className="px-5 py-6 text-center text-sm text-fg-muted">
              Nenhuma produção em chapas lançada no período.
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <KpiCard label="Chapas produzidas" value={formatNumber(chapas.producao)} icon={Layers} hint={`Meta: ${formatNumber(chapas.meta)} chapas`} accent />
                <KpiCard label="Meta de chapas" value={formatNumber(chapas.meta)} icon={Target} hint="Soma das metas" />
                <KpiCard label="Aproveitamento" value={formatPercent(chapas.aproveitamento)} icon={Percent} hint="Chapas ÷ meta" />
                <KpiCard label="Dias produzidos" value={formatNumber(chapas.diasProduzidos)} icon={CalendarCheck} hint={`${formatNumber(chapas.funcionariosAtivos)} funcionário(s)`} />
              </div>
              {chapas.ranking.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Ranking por chapas</CardTitle>
                    <CardDescription>Setor Fita</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RankingList ranking={chapas.ranking} />
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
