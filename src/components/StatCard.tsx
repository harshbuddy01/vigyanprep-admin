import React from 'react';
import { cn } from '../lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  accentColor?: 'amber' | 'emerald' | 'blue' | 'purple';
}

export function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  trend,
}: StatCardProps) {
  return (
    <div className="rounded-xl bg-[#14171d] border border-white/[0.07] p-5 transition-colors hover:border-white/[0.12]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono font-medium uppercase tracking-wider text-zinc-400">
          {label}
        </span>
        <div className="p-2 rounded-lg bg-zinc-800/80 border border-zinc-700/60 text-zinc-300">
          <Icon size={16} />
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div>
          <div className="text-2xl font-bold text-zinc-100 tracking-tight font-mono">
            {value}
          </div>
          {subtitle && (
            <p className="text-[11px] text-zinc-500 mt-0.5 font-mono">{subtitle}</p>
          )}
        </div>

        {trend && (
          <div
            className={cn(
              "inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-0.5 rounded-full border",
              trend.isPositive
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400/90"
                : "bg-rose-500/10 border-rose-500/20 text-rose-400/90"
            )}
          >
            {trend.isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            <span>{trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
