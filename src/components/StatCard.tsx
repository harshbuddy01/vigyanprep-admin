import React from 'react';
import { cn } from '../lib/utils';

interface StatCardProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatCard({ icon: Icon, label, value, trend }: StatCardProps) {
  return (
    <div className="bg-neutral-800/50 border border-white/10 p-6 rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <span className="text-neutral-400 text-sm">{label}</span>
        <div className="p-2 bg-neutral-900 rounded-lg">
          <Icon size={20} className="text-amber-400" />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-white">{value}</span>
        {trend && (
          <span
            className={cn(
              "text-xs mb-1",
              trend.isPositive ? "text-emerald-400" : "text-red-400"
            )}
          >
            {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
          </span>
        )}
      </div>
    </div>
  );
}
