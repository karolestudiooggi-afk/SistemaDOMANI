"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  valor,
  variacao,
  icon,
  suffix,
}: {
  label: string;
  valor: number | string;
  variacao?: number | null;
  icon: React.ReactNode;
  suffix?: string;
}) {
  const up = (variacao ?? 0) > 0;
  const down = (variacao ?? 0) < 0;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-line bg-surface-2 p-5 transition-all duration-300 hover:border-ember/30 animate-fade-up">
      <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-ember/5 blur-2xl transition-all group-hover:bg-ember/10" />
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-content-soft">{label}</span>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-3 text-ember">
          {icon}
        </div>
      </div>
      <div className="mt-3 flex items-end gap-2">
        <span className="font-display text-3xl text-content tabular">{valor}</span>
        {suffix && <span className="mb-1 text-sm text-content-mute">{suffix}</span>}
      </div>
      {variacao != null && (
        <div
          className={cn(
            "mt-2 inline-flex items-center gap-1 text-[12px] font-medium",
            up && "text-emerald-400",
            down && "text-red-400",
            !up && !down && "text-content-mute"
          )}
        >
          {up ? <TrendingUp className="h-3.5 w-3.5" /> : down ? <TrendingDown className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
          {Math.abs(variacao)}%
          <span className="text-content-mute">vs período anterior</span>
        </div>
      )}
    </div>
  );
}
