import { ArrowUpRight, ArrowDownRight, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type KpiCardProps = {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: { value: string; up: boolean };
  hint?: string;
  accent?: boolean;
};

export function KpiCard({ label, value, icon: Icon, trend, hint, accent }: KpiCardProps) {
  return (
    <Card
      className={cn(
        "group relative overflow-hidden p-5 transition-all hover:border-line-2",
        accent && "border-brand/30 bg-brand/[0.06]",
      )}
    >
      {accent && (
        <div className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-brand/20 blur-2xl" />
      )}
      <div className="relative flex items-start justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-fg-subtle">
          {label}
        </span>
        <span
          className={cn(
            "grid size-9 place-items-center rounded-xl transition-colors",
            accent ? "bg-brand text-white" : "bg-elevated text-brand-3 group-hover:bg-brand/15",
          )}
        >
          <Icon className="size-4.5" strokeWidth={2} />
        </span>
      </div>

      <div className="relative mt-4 flex items-end gap-2">
        <span className="text-3xl font-semibold tracking-tight text-fg tabular-nums">{value}</span>
        {trend && (
          <span
            className={cn(
              "mb-1 flex items-center gap-0.5 text-xs font-medium",
              trend.up ? "text-success" : "text-danger",
            )}
          >
            {trend.up ? (
              <ArrowUpRight className="size-3.5" />
            ) : (
              <ArrowDownRight className="size-3.5" />
            )}
            {trend.value}
          </span>
        )}
      </div>
      {hint && <p className="relative mt-1 text-xs text-fg-muted">{hint}</p>}
    </Card>
  );
}
