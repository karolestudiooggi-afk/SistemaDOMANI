"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  CartesianGrid,
} from "recharts";

const EMBER = "#E56D23";
const PALETTE = ["#E56D23", "#EC8B48", "#F3BC93", "#9E4514", "#C9591A"];

function TooltipBox({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-medium text-content">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-content-soft">
          <span style={{ color: p.color || EMBER }}>●</span> {p.value} {p.name}
        </p>
      ))}
    </div>
  );
}

export function AreaLinhas({ data }: { data: { dia: string; total: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="grad-ember" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={EMBER} stopOpacity={0.35} />
            <stop offset="100%" stopColor={EMBER} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
        <XAxis dataKey="dia" tick={{ fontSize: 11, fill: "var(--content-mute)" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "var(--content-mute)" }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip content={<TooltipBox />} cursor={{ stroke: EMBER, strokeOpacity: 0.2 }} />
        <Area
          type="monotone"
          dataKey="total"
          name="linhas"
          stroke={EMBER}
          strokeWidth={2}
          fill="url(#grad-ember)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function BarrasEquipes({ data }: { data: { nome: string; total: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
        <XAxis dataKey="nome" tick={{ fontSize: 11, fill: "var(--content-mute)" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "var(--content-mute)" }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip content={<TooltipBox />} cursor={{ fill: "var(--surface-3)", fillOpacity: 0.4 }} />
        <Bar dataKey="total" name="linhas" radius={[6, 6, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
