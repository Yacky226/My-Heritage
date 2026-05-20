import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

interface AlertProps {
  children: ReactNode;
  type?: 'success' | 'info' | 'warning' | 'danger';
  title?: string;
  className?: string;
}

export function Alert({ children, type = 'info', title, className = '' }: AlertProps) {
  const containerMap = {
    success: 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-350',
    info: 'bg-blue-50/50 dark:bg-blue-950/10 border-blue-100 dark:border-blue-900/30 text-blue-800 dark:text-blue-350',
    warning: 'bg-amber-50/50 dark:bg-amber-950/10 border-amber-100 dark:border-amber-900/30 text-amber-800 dark:text-amber-350',
    danger: 'bg-rose-50/50 dark:bg-rose-950/10 border-rose-100 dark:border-rose-900/30 text-rose-800 dark:text-rose-350',
  };

  const iconMap = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />,
    info: <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />,
    danger: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />,
  };

  return (
    <div
      className={`flex gap-3.5 p-4 rounded-xl border text-sm leading-relaxed ${containerMap[type]} ${className}`}
    >
      {iconMap[type]}
      <div className="flex-1">
        {title && (
          <h5 className="font-bold mb-1 text-slate-900 dark:text-white">
            {title}
          </h5>
        )}
        <div className="font-medium">{children}</div>
      </div>
    </div>
  );
}
