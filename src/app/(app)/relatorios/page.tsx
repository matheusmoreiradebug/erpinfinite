import { FileText, Download, BarChart3, Users, Boxes, Trophy, Target } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const reports = [
  {
    icon: Boxes,
    titulo: "Produção por setor",
    desc: "Total produzido, meta e aproveitamento de cada setor no período.",
  },
  {
    icon: Users,
    titulo: "Produção por funcionário",
    desc: "Desempenho individual com média diária e total do mês.",
  },
  {
    icon: Trophy,
    titulo: "Ranking de produtividade",
    desc: "Classificação dos funcionários mais produtivos.",
  },
  {
    icon: Target,
    titulo: "Meta × realizado",
    desc: "Comparativo de metas planejadas contra o realizado.",
  },
  {
    icon: BarChart3,
    titulo: "Aproveitamento geral",
    desc: "Visão consolidada do aproveitamento da fábrica no mês.",
  },
];

export default function RelatoriosPage() {
  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        title="Relatórios"
        subtitle="Gere documentos em PDF prontos para impressão e compartilhamento."
      >
        <Button size="sm">
          <Download className="size-4" />
          Relatório completo
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reports.map((r) => {
          const Icon = r.icon;
          return (
            <Card key={r.titulo} className="group transition-all hover:border-line-2">
              <CardContent className="flex h-full flex-col p-5">
                <div className="flex items-start justify-between">
                  <span className="grid size-11 place-items-center rounded-xl bg-elevated text-brand-3 transition-colors group-hover:bg-brand/15">
                    <Icon className="size-5" />
                  </span>
                  <Badge>
                    <FileText className="size-3" />
                    PDF
                  </Badge>
                </div>
                <h3 className="mt-4 font-medium text-fg">{r.titulo}</h3>
                <p className="mt-1 flex-1 text-sm leading-relaxed text-fg-muted">{r.desc}</p>
                <Button variant="secondary" size="sm" className="mt-4 w-full">
                  <Download className="size-4" />
                  Gerar PDF
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
