"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { formatCurrency } from "@/lib/utils";

const axisStyle = { fill: "#686f7b", fontSize: 12 };
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const mesLabel = (ym: string) => {
  const [, m] = ym.split("-");
  return `${MESES[Number(m) - 1] ?? m}/${ym.slice(2, 4)}`;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TooltipBox({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line-2 bg-ink-2/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      <p className="mb-1 font-medium text-fg">{label}</p>
      <p className="text-fg-muted">Perdido: <span className="font-medium text-danger">{formatCurrency(payload[0].value)}</span></p>
    </div>
  );
}

export function FreteTrendChart({ data }: { data: { mes: string; total: number }[] }) {
  const rows = data.map((d) => ({ mes: mesLabel(d.mes), total: d.total }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={rows} margin={{ top: 10, right: 8, left: 4, bottom: 0 }}>
        <CartesianGrid strokeDasharray="4 4" stroke="#23262f" vertical={false} />
        <XAxis dataKey="mes" tick={axisStyle} tickLine={false} axisLine={false} />
        <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={64} tickFormatter={(v) => formatCurrency(v).replace(/\s/g, "")} />
        <Tooltip content={<TooltipBox />} cursor={{ fill: "#ffffff08" }} />
        <Bar dataKey="total" radius={[6, 6, 0, 0]}>
          {rows.map((_, i) => (
            <Cell key={i} fill="#dc2626" fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
