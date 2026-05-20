import { useVaults } from '../../hooks/useVaults';
import type { Vault } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { sliceAddress } from '../../utils/format';
import { FileArchive, Heart, ChevronRight, Eye } from 'lucide-react';

interface VaultItemProps {
  vault: Vault;
  onViewDetails: (vault: Vault) => void;
  onEditHeir: (vault: Vault) => void;
}

export function VaultItem({ vault, onViewDetails }: VaultItemProps) {
  const { pingVault, isLoading } = useVaults();

  const handleHeartbeat = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await pingVault(vault.id);
  };

  return (
    <div
      onClick={() => onViewDetails(vault)}
      className="flex flex-col md:flex-row md:items-center justify-between p-4 md:p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-blue-400 dark:hover:border-blue-800 hover:shadow-md transition-all duration-200 cursor-pointer group text-left select-none gap-4"
    >
      {/* Icon & Title info */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-12 h-12 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-500 shrink-0 group-hover:text-blue-500 group-hover:border-blue-200/50 transition-colors">
          <FileArchive className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors truncate">
            {vault.name}
          </h4>
          <span className="text-xs text-slate-450 dark:text-slate-500 font-mono tracking-tight block mt-1">
            Heir: {sliceAddress(vault.heir)}
          </span>
        </div>
      </div>

      {/* Row Stats */}
      <div className="flex flex-wrap items-center md:justify-end gap-5 md:gap-8 ml-0 md:ml-auto">
        <div className="text-left md:text-right shrink-0">
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold block">Status</span>
          <Badge status={vault.status} className="mt-1" />
        </div>

        <div className="text-left md:text-right shrink-0">
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold block">Safety Window</span>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-350 block mt-1">
            {vault.inactivityTimer}
          </span>
        </div>

        <div className="text-left md:text-right shrink-0">
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold block">Storage Size</span>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mt-1">
            {vault.fileCount} file{vault.fileCount > 1 ? 's' : ''} ({vault.fileSize})
          </span>
        </div>

        {/* Action Toggles */}
        <div className="flex items-center gap-2 mt-2 md:mt-0 w-full md:w-auto ml-auto">
          {vault.status === 'Active' && (
            <Button
              variant="outline"
              size="sm"
              loading={isLoading}
              onClick={handleHeartbeat}
              className="text-xs px-3 py-1.5 shrink-0"
              icon={<Heart className="w-3.5 h-3.5 fill-current" />}
            >
              Ping
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(vault);
            }}
            className="text-xs px-3 py-1.5 shrink-0"
            icon={<Eye className="w-3.5 h-3.5" />}
          >
            Details
          </Button>

          <ChevronRight className="w-5 h-5 text-slate-350 dark:text-slate-600 shrink-0 hidden md:block group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
}
