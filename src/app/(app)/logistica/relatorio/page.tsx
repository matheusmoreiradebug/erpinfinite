import Link from "next/link";
import { ChevronLeft, ChevronRight, Boxes, Truck, CalendarCheck, Layers } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { getLoadingWeek, linhaLabel } from "@/lib/data/logistica";
import { businessWeek, formatWeekLabel, addDaysIso } from "@/lib/date-range";
import { formatNumber } from "@/lib/utils";

export default async function RelatorioSemanalPage({
  searchParams,
}: {
  searchParams: Promise<{ semana?: string }>;
}) {
  const sp = await searchParams;
  const week = businessWeek(sp.semana);
  const r = await getLoadingWeek(week);

  const prev = addDaysIso(week.from, -7);
  const next = addDaysIso(week.from, 7);

  // agrupa os itens por linha para a conferência
  const porLinhaItens = new Map<string, typeof r.itens>();
  for (const it of r.itens) {
    const arr = porLinhaItens.get(it.linha) ?? [];
    arr.push(it);
    porLinhaItens.set(it.linha, arr);
  }

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader title="Relatório semanal de carregamento" subtitle={formatWeekLabel(week)}>
        <Link href={`/logistica/relatorio?semana=${prev}`}>
          <span className="grid size-9 place-items-center rounded-xl border border-line bg-elevated text-fg-muted hover:bg-line-2 hover:text-fg"><ChevronLeft className="size-4" /></span>
        </Link>
        <Link href={`/logistica/relatorio?semana=${next}`}>
          <span className="grid size-9 place-items-center rounded-xl border border-line bg-elevated text-fg-muted hover:bg-line-2 hover:text-fg"><ChevronRight className="size-4" /></span>
        </Link>
      </PageHeader>

      {r.total === 0 ? (
        <div className="flex items-center gap-3 rounded-xl border border-line bg-panel/60 px-4 py-3 text-sm text-fg-muted">
          <CalendarCheck className="size-4 text-fg-subtle" />
          Nenhum carregamento lançado nesta semana.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard label="Total carregado" value={formatNumber(r.total)} icon={Boxes} hint={`${r.dias} dia(s)`} accent />
            <KpiCard label="Branco" value={formatNumber(r.totalBranco)} icon={Layers} hint="Peças brancas" />
            <KpiCard label="Preto" value={formatNumber(r.totalPreto)} icon={Layers} hint="Peças pretas" />
            <KpiCard label="Caminhões usados" value={formatNumber(r.porCaminhao.length)} icon={Truck} hint="Com carga na semana" />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Por linha de produto</CardTitle><CardDescription>Branco · preto · total</CardDescription></CardHeader>
              <CardContent className="space-y-1">
                {r.porLinha.map((l) => (
                  <div key={l.linha} className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-elevated">
                    <span className="text-sm font-medium text-fg">{l.label}</span>
                    <span className="flex items-center gap-3 text-xs text-fg-muted">
                      <span>B {formatNumber(l.branco)}</span>
                      <span>P {formatNumber(l.preto)}</span>
                      <Badge variant="brand">{formatNumber(l.total)}</Badge>
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Por caminhão</CardTitle><CardDescription>Total da semana</CardDescription></CardHeader>
              <CardContent className="space-y-1">
                {r.porCaminhao.map((c) => (
                  <div key={c.caminhao} className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-elevated">
                    <span className="flex items-center gap-2 text-sm font-medium text-fg"><Truck className="size-4 text-brand-3" /> Caminhão {c.caminhao}</span>
                    <span className="text-sm font-semibold tabular-nums text-fg">{formatNumber(c.total)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* detalhamento por linha para conferência */}
          {[...porLinhaItens.entries()].map(([linha, itens]) => (
            <Card key={linha}>
              <CardHeader><CardTitle>{linhaLabel(linha)} — itens da semana</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-line text-left text-xs font-medium uppercase tracking-wide text-fg-subtle">
                        <th className="px-3 py-2 font-medium">Caminhão</th>
                        <th className="px-3 py-2 font-medium">Móvel</th>
                        <th className="px-3 py-2 font-medium">Cor</th>
                        <th className="px-3 py-2 text-right font-medium">Qtd</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itens.map((it, i) => (
                        <tr key={i} className="border-b border-line/60 last:border-0">
                          <td className="px-3 py-2 text-fg-muted">{it.caminhao}</td>
                          <td className="px-3 py-2 text-fg">{it.movel}</td>
                          <td className="px-3 py-2">
                            <span className={it.cor === "branco" ? "text-fg-muted" : "text-fg"}>{it.cor === "branco" ? "Branco" : "Preto"}</span>
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-fg">{formatNumber(it.quantidade)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}
