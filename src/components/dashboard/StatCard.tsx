import type { ReactNode } from 'react';
import { Card } from '../ui/Card';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  color?: 'blue' | 'emerald' | 'purple' | 'rose';
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  trendType = 'neutral',
  color = 'blue',
}: StatCardProps) {
  const bgSoftColors = {
    blue: 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-450 border-blue-100/50 dark:border-blue-900/10',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 border-emerald-100/50 dark:border-emerald-900/10',
    purple: 'bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-450 border-purple-100/50 dark:border-purple-900/10',
    rose: 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 border-rose-100/50 dark:border-rose-900/10',
  };

  const trendColors = {
    positive: 'text-emerald-600 dark:text-emerald-450',
    negative: 'text-rose-600 dark:text-rose-450',
    neutral: 'text-slate-500 dark:text-slate-450',
  };

  return (
    <Card hoverable className="flex items-center justify-between border-slate-100/70">
      <div className="flex flex-col text-left">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {label}
        </span>
        <span className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mt-1.5 leading-none">
          {value}
        </span>
        {trend && (
          <span className={`text-2xs font-semibold mt-2 ${trendColors[trendType]}`}>
            {trend}
          </span>
        )}
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border text-lg shrink-0 ${bgSoftColors[color]}`}>
        {icon}
      </div>
    </Card>
  );
}
