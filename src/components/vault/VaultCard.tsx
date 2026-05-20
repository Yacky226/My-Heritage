import { useVaults } from '../../hooks/useVaults';
import type { Vault } from '../../types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { sliceAddress } from '../../utils/format';
import { FileArchive, Eye, Heart, Calendar, Trash2 } from 'lucide-react';

interface VaultCardProps {
  vault: Vault;
  onViewDetails: (vault: Vault) => void;
  onEditHeir: (vault: Vault) => void;
}

export function VaultCard({ vault, onViewDetails }: VaultCardProps) {
  const { pingVault, deleteVault, isLoading } = useVaults();

  const handleHeartbeat = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await pingVault(vault.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete the vault "${vault.name}"? This will permanently wipe your encrypted files from IPFS routing.`)) {
      deleteVault(vault.id);
    }
  };

  return (
    <Card hoverable className="flex flex-col justify-between border-slate-100/70 h-full relative group">
      {/* Upper header */}
      <div className="text-left w-full">
        <div className="flex justify-between items-center mb-3">
          <Badge status={vault.status} />
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleDelete}
              className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer"
              title="Delete Vault"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Info content */}
        <h4 className="text-base font-bold text-slate-900 dark:text-white truncate flex items-center gap-2 group-hover:text-blue-500 transition-colors">
          <FileArchive className="w-5 h-5 text-blue-500 shrink-0" />
          {vault.name}
        </h4>
        <p className="text-xs text-slate-400 dark:text-slate-500 font-mono tracking-tight mt-1.5 flex items-center gap-1">
          Heir: <code className="text-slate-550 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-850">{sliceAddress(vault.heir)}</code>
        </p>
        
        {vault.description && (
          <p className="text-xs text-slate-500 dark:text-slate-450 mt-3 line-clamp-2 leading-relaxed">
            {vault.description}
          </p>
        )}
      </div>

      {/* Footer statistics and CTAs */}
      <div className="mt-5 border-t border-slate-100 dark:border-slate-800/80 pt-4 w-full">
        <div className="grid grid-cols-2 gap-3 mb-4 text-left">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              Safety Timer
            </span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-350 block mt-0.5">
              {vault.inactivityTimer}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold flex items-center gap-1">
              <FileArchive className="w-3 h-3 text-slate-400" />
              Storage Size
            </span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-350 block mt-0.5">
              {vault.fileCount} file{vault.fileCount > 1 ? 's' : ''} ({vault.fileSize})
            </span>
          </div>
        </div>

        <div className="flex gap-2 w-full mt-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onViewDetails(vault)}
            className="flex-1 text-xs"
            icon={<Eye className="w-3.5 h-3.5" />}
          >
            Details
          </Button>

          {vault.status === 'Active' && (
            <Button
              variant="primary"
              size="sm"
              loading={isLoading}
              onClick={handleHeartbeat}
              className="flex-1 text-xs shadow-md shadow-blue-500/5"
              icon={<Heart className="w-3.5 h-3.5 fill-current" />}
            >
              Ping
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
