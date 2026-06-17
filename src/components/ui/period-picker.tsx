"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { DayPicker, type DateRange as RdpRange } from "react-day-picker";
import "react-day-picker/style.css";
import { CalendarDays, ChevronDown, Check } from "lucide-react";
import {
  type DateRange,
  type PresetKey,
  todayRange,
  weekRange,
  monthRange,
  detectPreset,
  formatRangeLabel,
  isoOf,
  dateOf,
} from "@/lib/date-range";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const presets: { key: PresetKey; label: string; range: () => DateRange }[] = [
  { key: "hoje", label: "Hoje", range: todayRange },
  { key: "semana", label: "Esta semana", range: weekRange },
  { key: "mes", label: "Este mês", range: monthRange },
];

export function PeriodPicker({ range }: { range: DateRange }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<RdpRange | undefined>({
    from: dateOf(range.from),
    to: dateOf(range.to),
  });

  const active = detectPreset(range);

  const apply = (r: DateRange) => {
    setOpen(false);
    router.push(`${pathname}?from=${r.from}&to=${r.to}`);
  };

  const applyCustom = () => {
    if (sel?.from) {
      const from = isoOf(sel.from);
      const to = isoOf(sel.to ?? sel.from);
      apply(from <= to ? { from, to } : { from: to, to: from });
    }
  };

  return (
    <div className="relative">
      <Button variant="secondary" size="sm" onClick={() => setOpen((o) => !o)}>
        <CalendarDays className="size-4 text-brand-3" />
        <span className="capitalize">{formatRangeLabel(range)}</span>
        <ChevronDown className="size-4 text-fg-subtle" />
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 w-[300px] overflow-hidden rounded-2xl border border-line bg-ink-2 shadow-2xl">
            {/* presets */}
            <div className="flex flex-wrap gap-1.5 border-b border-line p-3">
              {presets.map((p) => (
                <button
                  key={p.key}
                  onClick={() => apply(p.range())}
                  className={cn(
                    "rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                    active === p.key
                      ? "border-brand bg-brand/15 text-fg"
                      : "border-line text-fg-muted hover:bg-elevated hover:text-fg",
                  )}
                >
                  {p.label}
                </button>
              ))}
              <span
                className={cn(
                  "rounded-lg border px-2.5 py-1.5 text-xs font-medium",
                  active === "personalizado"
                    ? "border-brand bg-brand/15 text-fg"
                    : "border-line text-fg-subtle",
                )}
              >
                Personalizado
              </span>
            </div>

            {/* calendário */}
            <div className="p-2">
              <DayPicker
                mode="range"
                selected={sel}
                onSelect={setSel}
                numberOfMonths={1}
                showOutsideDays
                weekStartsOn={1}
              />
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-line p-3">
              <span className="text-xs text-fg-subtle">
                {sel?.from
                  ? `${isoOf(sel.from)}${sel.to && sel.to !== sel.from ? "  →  " + isoOf(sel.to) : ""}`
                  : "Selecione no calendário"}
              </span>
              <Button size="sm" onClick={applyCustom} disabled={!sel?.from}>
                <Check className="size-4" /> Aplicar
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
