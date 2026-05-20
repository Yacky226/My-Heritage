import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export function LoadingSpinner({ size = 'md', label }: LoadingSpinnerProps) {
  const sizeMap = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 gap-3">
      <Loader2 className={`animate-spin text-blue-600 dark:text-blue-450 ${sizeMap[size]}`} />
      {label && (
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-405 tracking-wider uppercase">
          {label}
        </span>
      )}
    </div>
  );
}

interface LoadingSkeletonProps {
  variant?: 'card' | 'list' | 'table';
  count?: number;
}

export function LoadingSkeleton({ variant = 'card', count = 1 }: LoadingSkeletonProps) {
  const renderItem = () => {
    switch (variant) {
      case 'list':
        return (
          <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl" />
              <div className="flex flex-col gap-2">
                <div className="w-36 h-4 bg-slate-150 dark:bg-slate-800 rounded" />
                <div className="w-56 h-3 bg-slate-100 dark:bg-slate-850 rounded" />
              </div>
            </div>
            <div className="w-20 h-8 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          </div>
        );
      case 'table':
        return (
          <div className="flex flex-col gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl animate-pulse">
            <div className="flex justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <div className="w-1/4 h-4 bg-slate-150 dark:bg-slate-800 rounded" />
              <div className="w-1/4 h-4 bg-slate-150 dark:bg-slate-800 rounded" />
              <div className="w-1/4 h-4 bg-slate-150 dark:bg-slate-800 rounded" />
            </div>
            <div className="flex justify-between py-2">
              <div className="w-1/4 h-3 bg-slate-100 dark:bg-slate-850 rounded" />
              <div className="w-1/4 h-3 bg-slate-100 dark:bg-slate-850 rounded" />
              <div className="w-1/4 h-3 bg-slate-100 dark:bg-slate-850 rounded" />
            </div>
            <div className="flex justify-between py-2">
              <div className="w-1/4 h-3 bg-slate-100 dark:bg-slate-850 rounded" />
              <div className="w-1/4 h-3 bg-slate-100 dark:bg-slate-850 rounded" />
              <div className="w-1/4 h-3 bg-slate-100 dark:bg-slate-850 rounded" />
            </div>
          </div>
        );
      case 'card':
      default:
        return (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 flex flex-col gap-4 animate-pulse">
            <div className="flex justify-between items-center">
              <div className="w-24 h-3 bg-slate-100 dark:bg-slate-850 rounded" />
              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-850 rounded-full" />
            </div>
            <div className="w-32 h-6 bg-slate-150 dark:bg-slate-800 rounded mt-2" />
            <div className="w-48 h-3.5 bg-slate-100 dark:bg-slate-850 rounded mt-1" />
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>{renderItem()}</div>
      ))}
    </div>
  );
}
