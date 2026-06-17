import {
  TrendingUp,
  CalendarDays,
  CalendarRange,
  Target,
  Percent,
  Users,
  Boxes,
  Trophy,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { DailyProductionChart, SectorProductionChart } from "@/components/dashboard/charts";
import { RankingList } from "@/components/dashboard/ranking-list";
import { AlertsPanel } from "@/components/dashboard/alerts-panel";
import { kpis, insights } from "@/lib/mock-data";
import { formatNumber, formatPercent } from "@/lib/utils";

export default function DashboardPage() {
  const atingido = kpis.producaoMes / kpis.metaMes;

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader title="Visão geral" subtitle="Produção da Infinite Móveis · junho/2026">
        <Button variant="secondary" size="sm">
          <CalendarRange className="size-4" />
          Junho 2026
        </Button>
        <Button size="sm">
          <TrendingUp className="size-4" />
          Exportar
        </Button>
      </PageHeader>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Produção do dia"
          value={formatNumber(kpis.producaoDia)}
          icon={CalendarDays}
          trend={{ value: "8%", up: true }}
          hint="16/06 · 5 setores"
          accent
        />
        <KpiCard
          label="Produção da semana"
          value={formatNumber(kpis.producaoSemana)}
          icon={CalendarRange}
          trend={{ value: "3%", up: true }}
          hint="Últimos 7 dias"
        />
        <KpiCard
          label="Produção do mês"
          value={formatNumber(kpis.producaoMes)}
          icon={TrendingUp}
          hint={`Meta: ${formatNumber(kpis.metaMes)} peças`}
        />
        <KpiCard
          label="Meta atingida"
          value={formatPercent(atingido)}
          icon={Percent}
          trend={{ value: "2%", up: false }}
          hint="Projeção: 92% no fechamento"
        />
        <KpiCard
          label="Meta do mês"
          value={formatNumber(kpis.metaMes)}
          icon={Target}
          hint="Consolidado dos 5 setores"
        />
        <KpiCard
          label="Funcionários ativos"
          value={formatNumber(kpis.funcionariosAtivos)}
          icon={Users}
          hint="Lançaram produção em junho"
        />
        <KpiCard
          label="Setores ativos"
          value={formatNumber(kpis.setoresAtivos)}
          icon={Boxes}
          hint="Acabamento, Fundo, Estante…"
        />
        <KpiCard
          label="Aproveitamento médio"
          value={formatPercent(0.74)}
          icon={Percent}
          trend={{ value: "1%", up: true }}
          hint="Média ponderada do mês"
        />
      </div>

      {/* gráficos */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Produção diária × meta</CardTitle>
              <CardDescription>Evolução ao longo de junho</CardDescription>
            </div>
            <Badge variant="brand">
              <span className="size-1.5 rounded-full bg-brand-3" />
              Tempo real
            </Badge>
          </CardHeader>
          <CardContent>
            <DailyProductionChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Produção por setor</CardTitle>
            <CardDescription>Realizado × meta no mês</CardDescription>
          </CardHeader>
          <CardContent>
            <SectorProductionChart />
          </CardContent>
        </Card>
      </div>

      {/* ranking + alertas + IA */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Ranking de produtividade</CardTitle>
              <CardDescription>Top funcionários do mês</CardDescription>
            </div>
            <Trophy className="size-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <RankingList />
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
            <AlertsPanel />
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
    </div>
  );
}
