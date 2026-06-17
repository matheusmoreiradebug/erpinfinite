"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts";
import { formatNumber } from "@/lib/utils";

type DailyPoint = { data: string; producao: number; meta: number };
type SectorPoint = { setor: string; producao: number; meta: number };

const axisStyle = { fill: "#686f7b", fontSize: 12 };

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line-2 bg-ink-2/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      <p className="mb-1.5 font-medium text-fg">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="flex items-center gap-2 text-fg-muted">
          <span className="size-2 rounded-full" style={{ backgroundColor: p.color }} />
          {p.name}: <span className="font-medium text-fg">{formatNumber(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

export function DailyProductionChart({ data }: { data: DailyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="gProd" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity={0.45} />
            <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gMeta" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9aa1ad" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#9aa1ad" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="4 4" stroke="#23262f" vertical={false} />
        <XAxis dataKey="data" tick={axisStyle} tickLine={false} axisLine={false} />
        <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={44} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#2c313c" }} />
        <Area
          type="monotone"
          dataKey="meta"
          name="Meta"
          stroke="#9aa1ad"
          strokeWidth={1.5}
          strokeDasharray="5 4"
          fill="url(#gMeta)"
        />
        <Area
          type="monotone"
          dataKey="producao"
          name="Produção"
          stroke="#3b82f6"
          strokeWidth={2.5}
          fill="url(#gProd)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function SectorProductionChart({ data }: { data: SectorPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="4 4" stroke="#23262f" vertical={false} />
        <XAxis dataKey="setor" tick={axisStyle} tickLine={false} axisLine={false} />
        <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={44} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(37,99,235,0.06)" }} />
        <Legend
          wrapperStyle={{ fontSize: 12, color: "#9aa1ad" }}
          iconType="circle"
          iconSize={8}
        />
        <Bar dataKey="meta" name="Meta" fill="#23262f" radius={[6, 6, 0, 0]} maxBarSize={28} />
        <Bar dataKey="producao" name="Produção" radius={[6, 6, 0, 0]} maxBarSize={28}>
          {data.map((entry, i) => {
            const pct = entry.producao / entry.meta;
            const color = pct < 0.7 ? "#ef4444" : pct < 0.9 ? "#f59e0b" : "#2563eb";
            return <Cell key={i} fill={color} />;
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
