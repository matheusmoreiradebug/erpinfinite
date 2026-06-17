import { AlertTriangle, AlertOctagon, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertItem = { id: string; nivel: "critico" | "alerta"; setor: string; mensagem: string };

export function AlertsPanel({ alerts }: { alerts: AlertItem[] }) {
  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-success/20 bg-success/[0.05] py-8 text-center">
        <ShieldCheck className="size-6 text-success" />
        <p className="text-sm text-fg-muted">Nenhum alerta. Todos os setores dentro da meta.</p>
      </div>
    );
  }
  return (
    <ul className="space-y-2.5">
      {alerts.map((a) => {
        const critico = a.nivel === "critico";
        const Icon = critico ? AlertOctagon : AlertTriangle;
        return (
          <li
            key={a.id}
            className={cn(
              "flex gap-3 rounded-xl border p-3",
              critico
                ? "border-danger/25 bg-danger/[0.07]"
                : "border-warning/25 bg-warning/[0.07]",
            )}
          >
            <Icon
              className={cn("mt-0.5 size-4.5 shrink-0", critico ? "text-danger" : "text-warning")}
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-fg">{a.setor}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-fg-muted">{a.mensagem}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
