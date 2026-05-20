import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hoverable?: boolean;
  glow?: boolean;
}

export function Card({
  children,
  hoverable = false,
  glow = false,
  className = '',
  ...props
}: CardProps) {
  const baseStyle =
    'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-6 transition-all duration-300';
  
  const hoverStyle = hoverable
    ? 'hover:shadow-lg hover:border-slate-200 dark:hover:border-slate-700/80 hover:-translate-y-[2px]'
    : 'shadow-sm';

  const glowStyle = glow
    ? 'shadow-[0_0_20px_rgba(59,130,246,0.1)] border-blue-500/20 dark:border-blue-500/10'
    : '';

  return (
    <div
      className={`${baseStyle} ${hoverStyle} ${glowStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardHeader({ children, className = '', ...props }: CardHeaderProps) {
  return (
    <div
      className={`border-b border-slate-100 dark:border-slate-800/80 pb-4 mb-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
  icon?: ReactNode;
}

export function CardTitle({ children, icon, className = '', ...props }: CardTitleProps) {
  return (
    <h3
      className={`text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 ${className}`}
      {...props}
    >
      {icon && <span className="text-blue-500 dark:text-blue-400 shrink-0">{icon}</span>}
      {children}
    </h3>
  );
}
