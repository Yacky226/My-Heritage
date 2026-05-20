interface BadgeProps {
  status: 'Active' | 'Locked' | 'Cooldown' | 'Claimed' | 'Pending' | 'Success' | 'Failed';
  className?: string;
}

export function Badge({ status, className = '' }: BadgeProps) {
  const colorMap = {
    Active: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/30',
    Success: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/30',
    Locked: 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 border border-rose-100 dark:border-rose-900/30',
    Failed: 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 border border-rose-100 dark:border-rose-900/30',
    Cooldown: 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-450 border border-amber-100 dark:border-amber-900/30',
    Pending: 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-450 border border-amber-100 dark:border-amber-900/30',
    Claimed: 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-450 border border-blue-100 dark:border-blue-900/30',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider shrink-0 ${colorMap[status] || 'bg-slate-100 text-slate-700'} ${className}`}
    >
      {status}
    </span>
  );
}
