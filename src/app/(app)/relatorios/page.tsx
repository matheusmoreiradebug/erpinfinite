import { FileText, Download, BarChart3, Users, Boxes, Trophy, Target } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PeriodPicker } from "@/components/ui/period-picker";
import { parseRange, formatRangeLabel } from "@/lib/date-range";

const reports = [
  {
    type: "setor",
    icon: Boxes,
    titulo: "Produção por setor",
    desc: "Total produzido, meta e aproveitamento de cada setor no período.",
  },
  {
    type: "funcionario",
    icon: Users,
    titulo: "Produção por funcionário",
    desc: "Desempenho individual com média diária e total do período.",
  },
  {
    type: "ranking",
    icon: Trophy,
    titulo: "Ranking de produtividade",
    desc: "Classificação dos funcionários mais produtivos.",
  },
  {
    type: "diaria",
    icon: Target,
    titulo: "Meta × realizado",
    desc: "Comparativo de metas planejadas contra o realizado, dia a dia.",
  },
  {
    type: "aproveitamento",
    icon: BarChart3,
    titulo: "Aproveitamento geral",
    desc: "Visão consolidada do aproveitamento da fábrica no período.",
  },
];

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const range = parseRange(await searchParams);
  const q = `from=${range.from}&to=${range.to}`;

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        title="Relatórios"
        subtitle={`Exportações do período · ${formatRangeLabel(range)}`}
      >
        <PeriodPicker range={range} />
        <a href={`/api/export?type=completo&${q}`}>
          <span className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-medium text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.6)] transition-colors hover:bg-brand-2">
            <Download className="size-4" />
            Relatório completo
          </span>
        </a>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reports.map((r) => {
          const Icon = r.icon;
          return (
            <Card key={r.type} className="group transition-all hover:border-line-2">
              <CardContent className="flex h-full flex-col p-5">
                <div className="flex items-start justify-between">
                  <span className="grid size-11 place-items-center rounded-xl bg-elevated text-brand-3 transition-colors group-hover:bg-brand/15">
                    <Icon className="size-5" />
                  </span>
                  <Badge>
                    <FileText className="size-3" />
                    CSV
                  </Badge>
                </div>
                <h3 className="mt-4 font-medium text-fg">{r.titulo}</h3>
                <p className="mt-1 flex-1 text-sm leading-relaxed text-fg-muted">{r.desc}</p>
                <a href={`/api/export?type=${r.type}&${q}`} className="mt-4">
                  <span className="flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-line bg-elevated text-sm font-medium text-fg transition-colors hover:bg-line-2">
                    <Download className="size-4" />
                    Exportar
                  </span>
                </a>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
