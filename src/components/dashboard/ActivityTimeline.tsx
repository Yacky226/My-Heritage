import { useVaults } from '../../hooks/useVaults';
import { useToast } from '../../hooks/useToast';
import { sliceAddress } from '../../utils/format';
import { Badge } from '../ui/Badge';
import { Vault as VaultIcon, ShieldAlert, Key, Link as LinkIcon, User } from 'lucide-react';

export function ActivityTimeline() {
  const { activities } = useVaults();
  const { addToast } = useToast();

  const iconMap = {
    VaultCreated: <VaultIcon className="w-4 h-4 text-blue-500" />,
    PingExecuted: <ShieldAlert className="w-4 h-4 text-emerald-500 animate-[pulse_1.5s_infinite]" />,
    HeirAssigned: <User className="w-4 h-4 text-purple-500" />,
    ClaimInitiated: <ShieldAlert className="w-4 h-4 text-rose-500" />,
    VaultDecrypted: <Key className="w-4 h-4 text-indigo-500" />,
  };

  const handleHashClick = (hash: string) => {
    navigator.clipboard.writeText(hash);
    addToast('Transaction hash copied to clipboard!', 'success', 2000);
  };

  return (
    <div className="flex flex-col gap-5 text-left">
      {activities.slice(0, 4).map((activity, idx) => (
        <div key={activity.id} className="relative flex gap-4 items-start select-none">
          {/* Stem line linking timeline circles */}
          {idx !== activities.slice(0, 4).length - 1 && (
            <div className="absolute left-[15px] top-8 bottom-[-20px] w-0.5 bg-slate-100 dark:bg-slate-850" />
          )}

          {/* Timeline icon circle */}
          <div className="w-8.5 h-8.5 rounded-full bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 flex items-center justify-center shrink-0 z-10 shadow-2xs">
            {iconMap[activity.type] || <LinkIcon className="w-4 h-4 text-slate-450" />}
          </div>

          {/* Description blocks */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-baseline gap-2">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                {activity.desc}
              </p>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0 font-medium whitespace-nowrap">
                {activity.date}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <Badge status={activity.status === 'Success' ? 'Success' : 'Failed'} className="scale-90" />
              <button
                onClick={() => handleHashClick(activity.hash)}
                className="text-[10px] text-slate-400 dark:text-slate-500 font-mono flex items-center gap-1 hover:text-blue-500 transition-colors cursor-pointer shrink-0"
              >
                <LinkIcon className="w-3 h-3" />
                <span>{sliceAddress(activity.hash)}</span>
              </button>
              <span className="text-[9px] text-slate-450 dark:text-slate-550 shrink-0">
                Block {activity.block}
              </span>
            </div>
          </div>
        </div>
      ))}

      {activities.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-6">No recent on-chain activities recorded.</p>
      )}
    </div>
  );
}
