import { Users, TrendingUp, PackageX, Percent, Trophy } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { PeriodPicker } from "@/components/ui/period-picker";
import { getEmployeePerformance } from "@/lib/data/quality";
import { parseRange, formatRangeLabel } from "@/lib/date-range";
import { formatNumber, formatPercent, formatCurrency, cn } from "@/lib/utils";

const medal = ["text-amber-400", "text-zinc-300", "text-amber-700"];

function taxaColor(t: number) {
  return t >= 0.05 ? "text-danger" : t > 0 ? "text-warning" : "text-success";
}

export default async function DesempenhoPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const range = parseRange(await searchParams);
  const rows = await getEmployeePerformance(range);

  const maxProd = rows[0]?.producao ?? 1;
  const totalProd = rows.reduce((a, r) => a + r.producao, 0);
  const totalRet = rows.reduce((a, r) => a + r.retornos, 0);
  const taxaMedia = totalProd ? totalRet / totalProd : 0;

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        title="Desempenho por funcionário"
        subtitle={`Produção × retornos · ${formatRangeLabel(range)}`}
      >
        <PeriodPicker range={range} />
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Funcionários ativos" value={formatNumber(rows.length)} icon={Users} hint="Com produção no período" accent />
        <KpiCard label="Produção total" value={formatNumber(totalProd)} icon={TrendingUp} hint="Soma de todos" />
        <KpiCard label="Peças retornadas" value={formatNumber(totalRet)} icon={PackageX} hint="No período" />
        <KpiCard label="Taxa média de retorno" value={formatPercent(taxaMedia, 1)} icon={Percent} hint="Retornos ÷ produção" />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs font-medium uppercase tracking-wide text-fg-subtle">
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Funcionário</th>
                <th className="px-4 py-3 font-medium">Setor</th>
                <th className="px-4 py-3 font-medium">Produção</th>
                <th className="px-4 py-3 text-right font-medium">Média/dia</th>
                <th className="px-4 py-3 text-right font-medium">Retornos</th>
                <th className="px-4 py-3 text-right font-medium">Taxa</th>
                <th className="px-4 py-3 text-right font-medium">Valor perdido</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className="border-b border-line/60 transition-colors last:border-0 hover:bg-elevated/50">
                  <td className="px-4 py-3">
                    {i < 3 ? <Trophy className={cn("size-4", medal[i])} /> : <span className="text-fg-subtle">{i + 1}</span>}
                  </td>
                  <td className="px-4 py-3 font-medium text-fg">{r.nome}</td>
                  <td className="px-4 py-3"><Badge>{r.setor}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-line">
                        <div className="h-full rounded-full bg-gradient-to-r from-brand to-brand-3" style={{ width: `${(r.producao / maxProd) * 100}%` }} />
                      </div>
                      <span className="tabular-nums text-fg">{formatNumber(r.producao)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-fg-muted">{r.media}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-fg-muted">
                    {r.retornos > 0 ? `${formatNumber(r.retornos)} (${r.ocorrencias})` : "—"}
                  </td>
                  <td className={cn("px-4 py-3 text-right font-semibold tabular-nums", taxaColor(r.taxaRetorno))}>
                    {formatPercent(r.taxaRetorno, 1)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-fg-muted">
                    {r.valorPerdido > 0 ? formatCurrency(r.valorPerdido) : "—"}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-fg-muted">
                    Nenhuma produção no período selecionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="text-center text-xs text-fg-subtle">
        Retornos no formato “peças (ocorrências)”. Taxa = peças retornadas ÷ produção.
      </p>
    </div>
  );
}
