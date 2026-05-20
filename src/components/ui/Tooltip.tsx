import { useState } from 'react';
import type { ReactNode } from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  content: string;
  children?: ReactNode;
  iconOnly?: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({
  content,
  children,
  iconOnly = false,
  position = 'top',
}: TooltipProps) {
  const [active, setActive] = useState(false);

  const positionStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowStyles = {
    top: 'top-full left-1/2 -translate-x-1/2 -mt-1 border-t-slate-900 border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 -mb-1 border-b-slate-900 border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 -ml-1 border-l-slate-900 border-y-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 -mr-1 border-r-slate-900 border-y-transparent border-l-transparent',
  };

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
    >
      {iconOnly ? (
        <HelpCircle className="w-4 h-4 text-slate-400 dark:text-slate-500 cursor-help hover:text-slate-650 transition-colors shrink-0" />
      ) : (
        children
      )}

      {active && (
        <div
          className={`absolute z-50 w-48 px-3 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg shadow-md pointer-events-none text-center ${positionStyles[position]}`}
        >
          {content}
          <div className={`absolute border-4 ${arrowStyles[position]}`} />
        </div>
      )}
    </div>
  );
}
