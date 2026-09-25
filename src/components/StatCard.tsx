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
  accentColor = 'amber'
}: StatCardProps) {
  const colorMap = {
    amber: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/25',
      text: 'text-amber-400',
      glow: 'group-hover:border-amber-500/40',
    },
    emerald: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/25',
      text: 'text-emerald-400',
      glow: 'group-hover:border-emerald-500/40',
    },
    blue: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/25',
      text: 'text-blue-400',
      glow: 'group-hover:border-blue-500/40',
    },
    purple: {
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/25',
      text: 'text-purple-400',
      glow: 'group-hover:border-purple-500/40',
    },
  };

  const colors = colorMap[accentColor] || colorMap.amber;

  return (
    <div
      className={cn(
        "relative rounded-2xl bg-[#0f121a]/80 backdrop-blur-xl border border-white/[0.08] p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(0,0,0,0.5)] group overflow-hidden",
        colors.glow
      )}
    >
      {/* Top subtle glow flare */}
      <div className="absolute -top-12 -right-12 w-28 h-28 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />

      <div className="flex items-center justify-between mb-4 relative z-10">
        <span className="text-xs font-mono font-medium uppercase tracking-wider text-neutral-400">
          {label}
        </span>
        <div
          className={cn(
            "p-2.5 rounded-xl border transition-all duration-300 group-hover:scale-110",
            colors.bg,
            colors.border,
            colors.text
          )}
        >
          <Icon size={18} />
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2 relative z-10">
        <div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
            {value}
          </div>
          {subtitle && (
            <p className="text-[11px] text-neutral-400 mt-1 font-mono">{subtitle}</p>
          )}
        </div>

        {trend && (
          <div
            className={cn(
              "inline-flex items-center gap-1 text-xs font-mono font-semibold px-2 py-0.5 rounded-full border",
              trend.isPositive
                ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                : "bg-red-500/10 border-red-500/25 text-red-400"
            )}
          >
            {trend.isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
