import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PeriodPicker } from "@/components/ui/period-picker";
import { HistoryFilters } from "@/components/qualidade/history-filters";
import { getReturnsList, getQualityCatalogs, type ReturnFilters, type ReturnStatus } from "@/lib/data/quality";
import { parseRange, formatRangeLabel } from "@/lib/date-range";
import { formatNumber, formatCurrency } from "@/lib/utils";

const statusVariant = {
  registrado: "warning",
  em_analise: "warning",
  classificado: "brand",
  resolvido: "success",
} as const;

export default async function HistoricoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const range = parseRange(sp);

  const filters: ReturnFilters = {
    range,
    status: sp.status ? [sp.status as ReturnStatus] : undefined,
    setorId: sp.setor,
    funcionarioId: sp.funcionario,
    truckId: sp.caminhao,
    categoryId: sp.categoria,
  };

  const [rows, catalogs] = await Promise.all([getReturnsList(filters), getQualityCatalogs()]);

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader title="Histórico de retornos" subtitle={`${rows.length} registros · ${formatRangeLabel(range)}`}>
        <PeriodPicker range={range} />
      </PageHeader>

      <HistoryFilters catalogs={catalogs} />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs font-medium uppercase tracking-wide text-fg-subtle">
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Produto</th>
                <th className="px-4 py-3 font-medium">Caminhão</th>
                <th className="px-4 py-3 font-medium">Setor</th>
                <th className="px-4 py-3 font-medium">Funcionário</th>
                <th className="px-4 py-3 font-medium">Motivo</th>
                <th className="px-4 py-3 text-right font-medium">Qtd</th>
                <th className="px-4 py-3 text-right font-medium">Valor</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-line/60 transition-colors last:border-0 hover:bg-elevated/50">
                  <td className="whitespace-nowrap px-4 py-3 text-fg-muted">
                    {r.data.split("-").reverse().join("/")}
                  </td>
                  <td className="px-4 py-3 font-medium text-fg">{r.product}</td>
                  <td className="px-4 py-3 text-fg-muted">{r.truck}</td>
                  <td className="px-4 py-3 text-fg-muted">{r.setor}</td>
                  <td className="px-4 py-3 text-fg-muted">{r.funcionario}</td>
                  <td className="px-4 py-3 text-fg-muted">
                    {r.motivo ? (
                      <span>
                        {r.categoria && <span className="text-fg-subtle">{r.categoria} · </span>}
                        {r.motivo}
                      </span>
                    ) : (
                      <span className="text-fg-subtle">— a classificar —</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-fg">{formatNumber(r.quantidade)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-fg-muted">
                    {r.valorPerdido ? formatCurrency(r.valorPerdido) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant[r.status]}>{r.status}</Badge>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-sm text-fg-muted">
                    Nenhum retorno encontrado para os filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
