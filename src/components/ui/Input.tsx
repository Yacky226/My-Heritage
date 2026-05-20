import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  icon?: ReactNode;
  suffix?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, icon, suffix, className = '', disabled, ...props }, ref) => {
    return (
      <div className="w-full text-left">
        {label && (
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-350 mb-2">
            {label}
          </label>
        )}
        <div className="relative rounded-xl shadow-xs">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            disabled={disabled}
            className={`
              w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-450 dark:placeholder-slate-550 text-sm transition-all duration-200
              ${icon ? 'pl-11' : 'pl-4'}
              ${suffix ? 'pr-11' : 'pr-4'}
              py-3
              focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none
              disabled:bg-slate-50 dark:disabled:bg-slate-950/40 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed
              ${error ? 'border-rose-300 dark:border-rose-900/50 focus:ring-rose-500/20 focus:border-rose-500' : ''}
              ${className}
            `}
            {...props}
          />
          {suffix && (
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 dark:text-slate-500">
              {suffix}
            </div>
          )}
        </div>
        {error && (
          <div className="flex items-center gap-1.5 mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-450">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{error}</span>
          </div>
        )}
        {!error && helperText && (
          <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500 font-medium">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
