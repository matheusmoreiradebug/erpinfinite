import { Plus, Target, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { sectors, employees, sectorProduction } from "@/lib/mock-data";
import { cn, formatNumber, formatPercent, aproveitamentoStatus } from "@/lib/utils";

export default function SetoresPage() {
  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader title="Setores" subtitle={`${sectors.length} setores ativos`}>
        <Button size="sm">
          <Plus className="size-4" />
          Novo setor
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sectors.map((s) => {
          const prod = sectorProduction.find((p) => p.setor === s.nome);
          const realizado = prod?.producao ?? 0;
          const meta = prod?.meta ?? 0;
          const pct = meta > 0 ? realizado / meta : 0;
          const status = aproveitamentoStatus(pct);
          const headcount = employees.filter((e) => e.setorId === s.id).length;

          const barColor =
            status === "critico"
              ? "bg-danger"
              : status === "alerta"
                ? "bg-warning"
                : status === "otimo"
                  ? "bg-success"
                  : "bg-brand";

          return (
            <Card key={s.id} className="transition-all hover:border-line-2">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className="size-10 shrink-0 rounded-xl"
                      style={{ backgroundColor: s.cor }}
                    />
                    <div>
                      <h3 className="font-medium text-fg">{s.nome}</h3>
                      <p className="text-xs text-fg-subtle">{s.metaIndividual} pç/funcionário</p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      status === "critico"
                        ? "danger"
                        : status === "alerta"
                          ? "warning"
                          : status === "otimo"
                            ? "success"
                            : "brand"
                    }
                  >
                    {formatPercent(pct)}
                  </Badge>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-fg-muted">
                    <span>Realizado no mês</span>
                    <span className="font-medium text-fg">
                      {formatNumber(realizado)} / {formatNumber(meta)}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
                    <div
                      className={cn("h-full rounded-full", barColor)}
                      style={{ width: `${Math.min(pct * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 rounded-xl border border-line bg-panel/60 px-3 py-2">
                    <Users className="size-4 text-brand-3" />
                    <div className="leading-tight">
                      <p className="text-sm font-semibold text-fg">{headcount}</p>
                      <p className="text-[11px] text-fg-subtle">pessoas</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-line bg-panel/60 px-3 py-2">
                    <Target className="size-4 text-brand-3" />
                    <div className="leading-tight">
                      <p className="text-sm font-semibold text-fg">{s.metaIndividual}</p>
                      <p className="text-[11px] text-fg-subtle">meta/dia</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
