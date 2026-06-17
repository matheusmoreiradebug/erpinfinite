import { Trophy } from "lucide-react";
import { ranking } from "@/lib/mock-data";
import { formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";

const medalColor = ["text-amber-400", "text-zinc-300", "text-amber-700"];

export function RankingList() {
  const max = ranking[0]?.total ?? 1;
  return (
    <ul className="space-y-1">
      {ranking.map((r, i) => (
        <li
          key={r.nome}
          className="group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-elevated"
        >
          <span
            className={cn(
              "grid size-7 shrink-0 place-items-center rounded-lg text-xs font-semibold",
              i < 3 ? "bg-elevated" : "text-fg-subtle",
            )}
          >
            {i < 3 ? <Trophy className={cn("size-4", medalColor[i])} /> : i + 1}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-medium text-fg">{r.nome}</span>
              <span className="text-sm font-semibold tabular-nums text-fg">
                {formatNumber(r.total)}
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand to-brand-3"
                  style={{ width: `${(r.total / max) * 100}%` }}
                />
              </div>
              <span className="shrink-0 text-[11px] text-fg-subtle">{r.setor}</span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
