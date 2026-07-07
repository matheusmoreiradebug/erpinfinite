import { TrendingDown, DollarSign, PackageX, Receipt, Truck, Users, XCircle, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { PeriodPicker } from "@/components/ui/period-picker";
import { FreteTrendChart } from "@/components/frete/frete-chart";
import { getFreteDashboard } from "@/lib/data/quality";
import { freteCenarioLabel, freteCenarioCor } from "@/lib/qualidade";
import { parseRange, formatRangeLabel } from "@/lib/date-range";
import { formatNumber, formatCurrency, cn } from "@/lib/utils";

const br = (iso: string) => iso.split("-").reverse().join("/");

export default async function FretePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const range = parseRange(await searchParams);
  const d = await getFreteDashboard(range);

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader title="Perdas com frete" subtitle={`Prejuízo com retornos de entrega · ${formatRangeLabel(range)}`}>
        <PeriodPicker range={range} />
      </PageHeader>

      {d.semVazio && (
        <div className="flex items-center gap-3 rounded-xl border border-line bg-panel/60 px-4 py-3 text-sm text-fg-muted">
          <TrendingDown className="size-4 text-fg-subtle" />
          Nenhum frete de retorno registrado neste período. Preencha o valor do frete ao registrar um retorno.
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total perdido" value={formatCurrency(d.total)} icon={DollarSign} hint={`${formatNumber(d.ocorrencias)} retornos`} accent />
        <KpiCard label="Ticket médio" value={formatCurrency(d.ticketMedio)} icon={Receipt} hint="Por retorno" />
        <KpiCard label="Perda total" value={formatCurrency(d.perdaTotal)} icon={XCircle} hint="Pedido morto / b.o." />
        <KpiCard label="Remarcação" value={formatCurrency(d.remarcacao)} icon={RotateCcw} hint="Cliente paga a próxima" />
      </div>

      {/* tendência mensal */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Perda por mês</CardTitle>
            <CardDescription>Quanto foi embora nas voltas, mês a mês</CardDescription>
          </div>
          <TrendingDown className="size-4 text-danger" />
        </CardHeader>
        <CardContent>
          {d.porMes.length ? (
            <FreteTrendChart data={d.porMes} />
          ) : (
            <p className="py-10 text-center text-sm text-fg-muted">Sem dados no período.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* por cliente */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Maiores prejuízos por cliente</CardTitle>
              <CardDescription>Onde a volta mais dói</CardDescription>
            </div>
            <Users className="size-4 text-brand-3" />
          </CardHeader>
          <CardContent>
            <RankLista rows={d.porCliente} total={d.total} />
          </CardContent>
        </Card>

        {/* por motorista */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Por motorista / veículo</CardTitle>
              <CardDescription>Frete de retorno acumulado</CardDescription>
            </div>
            <Truck className="size-4 text-brand-3" />
          </CardHeader>
          <CardContent>
            <RankLista rows={d.porMotorista} total={d.total} />
          </CardContent>
        </Card>
      </div>

      {/* recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Retornos com frete recentes</CardTitle>
          <CardDescription>Últimos lançamentos de perda</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs font-medium uppercase tracking-wide text-fg-subtle">
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Pedido</th>
                <th className="px-4 py-3 font-medium">Motorista</th>
                <th className="px-4 py-3 font-medium">Cenário</th>
                <th className="px-4 py-3 text-right font-medium">Valor</th>
              </tr>
            </thead>
            <tbody>
              {d.recentes.map((r) => (
                <tr key={r.id} className="border-b border-line/60 last:border-0">
                  <td className="whitespace-nowrap px-4 py-2.5 text-fg-muted">{br(r.data)}</td>
                  <td className="px-4 py-2.5 text-fg">{r.cliente}</td>
                  <td className="px-4 py-2.5 text-fg-muted">{r.pedido ?? "—"}</td>
                  <td className="px-4 py-2.5 text-fg-muted">{r.motorista ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    {r.cenario ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-fg-muted">
                        <span className="size-2 rounded-full" style={{ backgroundColor: freteCenarioCor(r.cenario) }} />
                        {freteCenarioLabel(r.cenario)}
                      </span>
                    ) : <span className="text-fg-subtle">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-danger">{formatCurrency(r.valor)}</td>
                </tr>
              ))}
              {d.recentes.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-fg-muted">Nenhum lançamento.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function RankLista({ rows, total }: { rows: { nome: string; total: number; count: number }[]; total: number }) {
  if (rows.length === 0) return <p className="py-6 text-center text-sm text-fg-muted">Sem dados no período.</p>;
  const max = Math.max(...rows.map((r) => r.total), 1);
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.nome}>
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <span className="truncate text-sm font-medium text-fg">{r.nome}</span>
            <span className="shrink-0 text-sm font-semibold tabular-nums text-fg">
              {formatCurrency(r.total)}
              <span className="ml-1 text-[11px] font-normal text-fg-subtle">{total ? Math.round((r.total / total) * 100) : 0}%</span>
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-line">
            <div className={cn("h-full rounded-full bg-danger/70")} style={{ width: `${(r.total / max) * 100}%` }} />
          </div>
          <p className="mt-0.5 text-[11px] text-fg-subtle">{formatNumber(r.count)} retorno{r.count === 1 ? "" : "s"}</p>
        </li>
      ))}
    </ul>
  );
}
