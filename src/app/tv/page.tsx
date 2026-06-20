import { Radio, Trophy, AlertTriangle, PackageX } from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { AutoRefresh } from "@/components/tv/auto-refresh";
import { getDashboardData, getLatestProductionDate } from "@/lib/data/queries";
import { getQualityDashboard } from "@/lib/data/quality";
import { businessWeek, todayRange, dateOf } from "@/lib/date-range";
import { formatNumber, formatPercent, cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TvPage() {
  const dia = (await getLatestProductionDate()) ?? todayRange().from;
  const dayRange = { from: dia, to: dia };
  const week = businessWeek(dia);

  const [prod, qual] = await Promise.all([
    getDashboardData(dayRange),
    getQualityDashboard(week),
  ]);

  const ef = prod.kpis.aproveitamento;
  const efColor =
    ef >= 1 ? "text-success" : ef >= 0.85 ? "text-brand-3" : ef >= 0.7 ? "text-warning" : "text-danger";
  const dataLabel = `${String(dateOf(dia).getDate()).padStart(2, "0")}/${String(dateOf(dia).getMonth() + 1).padStart(2, "0")}/${dateOf(dia).getFullYear()}`;
  const maxSetor = Math.max(...prod.sectorProduction.map((s) => s.meta || s.producao), 1);

  return (
    <div className="flex min-h-screen flex-col bg-ink p-6 lg:p-8">
      {/* topo */}
      <header className="flex items-center justify-between border-b border-line pb-5">
        <div className="flex items-center gap-4">
          <BrandLogo size={48} />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-fg">Produção ao vivo</h1>
            <p className="text-sm text-fg-subtle">Infinite Móveis · {dataLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-fg-muted">
          <span className="flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1.5 text-sm font-medium text-success">
            <Radio className="size-4 animate-pulse" /> Ao vivo
          </span>
          <span className="text-3xl font-semibold text-fg">
            <AutoRefresh seconds={30} />
          </span>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-6 pt-6 xl:grid-cols-3">
        {/* coluna principal */}
        <div className="space-y-6 xl:col-span-2">
          {/* números gigantes */}
          <div className="grid grid-cols-3 gap-6">
            <BigStat label="Meta do dia" value={formatNumber(prod.kpis.meta)} />
            <BigStat label="Produção atual" value={formatNumber(prod.kpis.producao)} accent />
            <BigStat label="Eficiência" value={formatPercent(ef)} valueClass={efColor} />
          </div>

          {/* produção por setor */}
          <div className="rounded-2xl border border-line bg-panel/60 p-6">
            <h2 className="mb-4 text-lg font-medium text-fg">Produção por setor</h2>
            <div className="space-y-4">
              {prod.sectorProduction.map((s) => (
                <div key={s.setor}>
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <span className="text-base font-medium text-fg">{s.setor}</span>
                    <span className="text-lg font-semibold tabular-nums text-fg">
                      {formatNumber(s.producao)}
                      <span className="text-sm font-normal text-fg-subtle"> / {formatNumber(s.meta)}</span>
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-line">
                    <div className="h-full rounded-full bg-gradient-to-r from-brand to-brand-3" style={{ width: `${Math.min((s.producao / maxSetor) * 100, 100)}%` }} />
                  </div>
                </div>
              ))}
              {prod.sectorProduction.length === 0 && (
                <p className="py-6 text-center text-fg-muted">Aguardando lançamentos do dia…</p>
              )}
            </div>
          </div>
        </div>

        {/* coluna lateral */}
        <div className="space-y-6">
          {/* ranking */}
          <div className="rounded-2xl border border-line bg-panel/60 p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-medium text-fg">
              <Trophy className="size-5 text-amber-400" /> Ranking do dia
            </h2>
            <div className="space-y-2.5">
              {prod.ranking.slice(0, 5).map((r, i) => (
                <div key={r.nome} className="flex items-center justify-between">
                  <span className="flex items-center gap-3 text-base text-fg">
                    <span className={cn("grid size-7 place-items-center rounded-lg text-sm font-semibold", i === 0 ? "bg-amber-400/20 text-amber-400" : "bg-elevated text-fg-subtle")}>{i + 1}</span>
                    {r.nome}
                  </span>
                  <span className="text-lg font-semibold tabular-nums text-fg">{formatNumber(r.total)}</span>
                </div>
              ))}
              {prod.ranking.length === 0 && <p className="py-4 text-center text-fg-muted">—</p>}
            </div>
          </div>

          {/* devoluções da semana */}
          <div className="flex items-center justify-between rounded-2xl border border-line bg-panel/60 p-6">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-danger/15 text-danger"><PackageX className="size-6" /></span>
              <span className="text-base text-fg-muted">Devoluções da semana</span>
            </div>
            <span className="text-4xl font-semibold tabular-nums text-fg">{formatNumber(qual.pecas)}</span>
          </div>

          {/* alertas */}
          <div className="rounded-2xl border border-line bg-panel/60 p-6">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-medium text-fg">
              <AlertTriangle className="size-5 text-warning" /> Alertas
            </h2>
            <div className="space-y-2">
              {prod.alerts.length === 0 ? (
                <p className="text-sm text-success">Tudo dentro da meta. ✓</p>
              ) : (
                prod.alerts.map((a) => {
                  const crit = a.nivel === "critico";
                  return (
                    <div key={a.id} className={cn("rounded-xl border px-3 py-2 text-sm", crit ? "border-danger/30 bg-danger/10 text-danger" : "border-warning/30 bg-warning/10 text-warning")}>
                      <span className="font-medium">{a.setor}</span>
                      <span className="text-fg-muted"> — {a.mensagem}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BigStat({ label, value, accent, valueClass }: { label: string; value: string; accent?: boolean; valueClass?: string }) {
  return (
    <div className={cn("rounded-2xl border p-6 text-center", accent ? "border-brand/40 bg-brand/[0.08]" : "border-line bg-panel/60")}>
      <p className="text-sm font-medium uppercase tracking-wide text-fg-subtle">{label}</p>
      <p className={cn("mt-2 text-6xl font-semibold tabular-nums", valueClass ?? (accent ? "text-brand-3" : "text-fg"))}>{value}</p>
    </div>
  );
}
