import { PackageX, Percent, Boxes, DollarSign, Truck, Users, ShieldAlert, FileText, FileSpreadsheet } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { PeriodPicker } from "@/components/ui/period-picker";
import { getQualityDashboard } from "@/lib/data/quality";
import { parseRange, formatRangeLabel } from "@/lib/date-range";
import { formatNumber, formatPercent, formatCurrency, cn } from "@/lib/utils";

function taxaColor(t: number) {
  return t >= 0.1 ? "text-danger" : t >= 0.05 ? "text-warning" : "text-fg";
}

export default async function QualidadePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const range = parseRange(await searchParams);
  const d = await getQualityDashboard(range);

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader title="Qualidade" subtitle={`Retornos e avarias · ${formatRangeLabel(range)}`}>
        <PeriodPicker range={range} />
        <a href={`/api/export?type=qualidade&format=csv&from=${range.from}&to=${range.to}`}>
          <span className="inline-flex h-9 items-center gap-2 rounded-xl border border-line bg-elevated px-3 text-sm font-medium text-fg transition-colors hover:bg-line-2">
            <FileSpreadsheet className="size-4" />
            CSV
          </span>
        </a>
        <a href={`/api/export?type=qualidade&format=pdf&from=${range.from}&to=${range.to}`}>
          <span className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-medium text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.6)] transition-colors hover:bg-brand-2">
            <FileText className="size-4" />
            PDF
          </span>
        </a>
      </PageHeader>

      {d.semVazio && (
        <div className="flex items-center gap-3 rounded-xl border border-line bg-panel/60 px-4 py-3 text-sm text-fg-muted">
          <ShieldAlert className="size-4 text-fg-subtle" />
          Nenhum retorno registrado neste período.
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Retornos no período" value={formatNumber(d.retornos)} icon={PackageX} hint={`${formatNumber(d.pecas)} peças`} accent />
        <KpiCard label="% sobre produção" value={formatPercent(d.percentRetorno, 1)} icon={Percent} hint={`Produção: ${formatNumber(d.producao)}`} />
        <KpiCard label="Peças retornadas" value={formatNumber(d.pecas)} icon={Boxes} hint="Soma das quantidades" />
        <KpiCard label="Valor estimado perdido" value={formatCurrency(d.valorPerdido)} icon={DollarSign} hint="Custo das peças" />
      </div>

      {/* problemas por categoria */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {(d.porCategoria.length ? d.porCategoria : [{ categoria: "Sem dados", cor: "#6b7280", ocorrencias: 0 }]).map((c) => (
          <Card key={c.categoria} className="p-4">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: c.cor }} />
              <span className="text-xs font-medium uppercase tracking-wide text-fg-subtle">{c.categoria}</span>
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-fg">{formatNumber(c.ocorrencias)}</p>
            <p className="text-xs text-fg-muted">ocorrências</p>
          </Card>
        ))}
      </div>

      {/* análises */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* por caminhão */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Por caminhão</CardTitle>
              <CardDescription>Entregas × retornos = taxa</CardDescription>
            </div>
            <Truck className="size-4 text-brand-3" />
          </CardHeader>
          <CardContent>
            <AnaliseLista
              rows={d.porCaminhao.map((c) => ({
                nome: c.nome,
                a: `${formatNumber(c.entregas)} entr.`,
                b: `${formatNumber(c.retornos)} ret.`,
                taxa: c.entregas ? c.taxa : null,
              }))}
            />
          </CardContent>
        </Card>

        {/* por funcionário */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Por funcionário</CardTitle>
              <CardDescription>Maior taxa de erro</CardDescription>
            </div>
            <Users className="size-4 text-brand-3" />
          </CardHeader>
          <CardContent>
            <AnaliseLista
              rows={d.porFuncionario.map((f) => ({
                nome: f.nome,
                a: `${formatNumber(f.producao)} prod.`,
                b: `${formatNumber(f.retornos)} ret.`,
                taxa: f.producao ? f.taxa : null,
              }))}
            />
          </CardContent>
        </Card>

        {/* por setor */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Por setor</CardTitle>
              <CardDescription>Taxa de retorno</CardDescription>
            </div>
            <Boxes className="size-4 text-brand-3" />
          </CardHeader>
          <CardContent>
            <AnaliseLista
              rows={d.porSetor.map((s) => ({
                nome: s.nome,
                a: `${formatNumber(s.producao)} prod.`,
                b: `${formatNumber(s.retornos)} ret.`,
                taxa: s.producao ? s.taxa : null,
              }))}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AnaliseLista({
  rows,
}: {
  rows: { nome: string; a: string; b: string; taxa: number | null }[];
}) {
  if (rows.length === 0) {
    return <p className="py-6 text-center text-sm text-fg-muted">Sem dados no período.</p>;
  }
  return (
    <ul className="space-y-1">
      {rows.map((r, i) => (
        <li key={i} className="flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 hover:bg-elevated">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-fg">{r.nome}</p>
            <p className="text-[11px] text-fg-subtle">{r.a} · {r.b}</p>
          </div>
          <span className={cn("shrink-0 text-sm font-semibold tabular-nums", r.taxa === null ? "text-fg-subtle" : taxaColor(r.taxa))}>
            {r.taxa === null ? "—" : formatPercent(r.taxa, 1)}
          </span>
        </li>
      ))}
    </ul>
  );
}
