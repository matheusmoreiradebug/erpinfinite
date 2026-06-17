import { AlertTriangle, AlertOctagon } from "lucide-react";
import { alerts } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function AlertsPanel() {
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
