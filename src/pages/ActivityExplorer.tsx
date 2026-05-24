import { useState } from 'react';
import { useVaults } from '../hooks/useVaults';
import { useWallet } from '../hooks/useWallet';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useToast } from '../hooks/useToast';
import {
  Search,
  Copy,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  Database
} from 'lucide-react';
import { sliceAddress } from '../utils/format';

interface ActivityExplorerProps {
  onNavigate: (pageId: string) => void;
}

type TabType = 'All' | 'Heartbeats' | 'Vaults' | 'Claims';

export function ActivityExplorer({ onNavigate }: ActivityExplorerProps) {
  const { activities } = useVaults();
  const { wallet } = useWallet();
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('All');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    addToast('Transaction hash copied to clipboard!', 'success', 2000);
  };

  // Filter activities by tab and search term
  const filteredActivities = activities.filter((act) => {
    // Search filtering
    const matchesSearch =
      act.desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (act.txFrom ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (act.relatedAddresses ?? []).some((address) => address.includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    // Tab filtering
    if (activeTab === 'Heartbeats') return act.type === 'PingExecuted';
    if (activeTab === 'Vaults') {
      return [
        'VaultCreated',
        'VaultHeirUpdated',
        'VaultCidUpdated',
        'VaultRevoked',
        'VaultLocked',
        'HeirAssigned',
      ].includes(act.type);
    }
    if (activeTab === 'Claims') {
      return ['VaultClaimed', 'ClaimInitiated', 'VaultDecrypted'].includes(act.type);
    }
    
    return true;
  });

  // Pagination bounds
  const totalItems = filteredActivities.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedActivities = filteredActivities.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const getEventBadgeColor = (type: string) => {
    switch (type) {
      case 'VaultCreated':
        return 'badge-blue';
      case 'PingExecuted':
        return 'badge-emerald';
      case 'HeirAssigned':
      case 'VaultHeirUpdated':
      case 'VaultCidUpdated':
      case 'VaultLocked':
        return 'badge-slate';
      case 'ClaimInitiated':
      case 'VaultClaimed':
        return 'badge-rose';
      case 'VaultRevoked':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300';
      case 'VaultDecrypted':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
      default:
        return 'badge-slate';
    }
  };

  const getEventLabel = (type: string) => {
    switch (type) {
      case 'VaultCreated': return 'Vault Deployed';
      case 'PingExecuted': return 'Heartbeat Signature';
      case 'VaultClaimed': return 'Vault Claimed';
      case 'VaultRevoked': return 'Vault Revoked';
      case 'VaultHeirUpdated': return 'Heir Updated';
      case 'VaultCidUpdated': return 'CID Updated';
      case 'VaultLocked': return 'Vault Locked';
      case 'HeirAssigned': return 'Heir Appointed';
      case 'ClaimInitiated': return 'Claim Dispatched';
      case 'VaultDecrypted': return 'Decryption Key Lock';
      default: return type;
    }
  };

  const isWalletTransaction = (txFrom?: string) => {
    return Boolean(
      wallet.address &&
      txFrom &&
      txFrom.toLowerCase() === wallet.address.toLowerCase(),
    );
  };

  const getGasLabel = (gasUsed: string, txFrom?: string) => {
    if (isWalletTransaction(txFrom)) return gasUsed;
    if (txFrom) return `Paid by ${sliceAddress(txFrom)}`;
    return 'n/a';
  };

  return (
    <div className="flex flex-col gap-8 text-left select-none">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-6">
        <div>
          <div className="flex gap-2 text-xs text-slate-400 dark:text-slate-500 font-semibold mb-2 uppercase tracking-widest">
            <span>Home</span>
            <span>/</span>
            <span className="text-blue-500">Activity Explorer</span>
          </div>
          <h1 className="text-2xl md:text-3.5xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ArrowRightLeft className="w-7 h-7 text-blue-500" />
            My Activity Ledger
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-405 leading-relaxed mt-1">
            Wallet-scoped contract activity for vaults you own, inherit, or transactions you signed.
          </p>
        </div>
        <div className="flex gap-2.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('dashboard')}
            className="text-xs font-bold text-slate-500 hover:text-slate-900"
          >
            Overview
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('vaults')}
            className="text-xs font-bold border-slate-200"
          >
            Manage Vaults
          </Button>
        </div>
      </div>

      {/* Control Panel: Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Navigation Tabs */}
        <div className="flex bg-slate-100/80 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-900/60 self-start shrink-0">
          {(['All', 'Heartbeats', 'Vaults', 'Claims'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all ${
                activeTab === tab
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-350'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="w-full md:max-w-md shrink-0">
          <Input
            placeholder="Search by details, hash, or wallet address..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            icon={<Search className="w-4 h-4 text-slate-400" />}
            className="py-2.5 text-xs rounded-2xl shadow-inner-sm border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/40"
          />
        </div>
      </div>

      {/* Audit Table */}
      <Card className="border-slate-100/70 w-full overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/80">
            <thead className="bg-slate-50 dark:bg-slate-950/60 text-left">
              <tr>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-normal text-slate-450">
                  Transaction Hash
                </th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-normal text-slate-450">
                  Block Height
                </th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-normal text-slate-450">
                  Event Registry
                </th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-normal text-slate-450">
                  Audit Details
                </th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-normal text-slate-450">
                  Date / Time
                </th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-normal text-slate-450">
                  Wallet Gas
                </th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-normal text-slate-450 text-right">
                  Tx Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-slate-900 font-medium">
              {paginatedActivities.map((act) => (
                <tr
                  key={act.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-850/40 transition-colors text-xs"
                >
                  <td className="px-6 py-4.5 font-mono text-blue-500 dark:text-blue-400">
                    <div className="flex items-center gap-1.5">
                      <span>{sliceAddress(act.hash)}</span>
                      <button
                        onClick={() => handleCopyHash(act.hash)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                        title="Copy Tx Hash"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4.5 font-mono text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <Database className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{act.block.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4.5">
                    <span className={`badge px-2.5 py-1 text-[10px] uppercase font-mono rounded-lg tracking-wider ${getEventBadgeColor(act.type)}`}>
                      {getEventLabel(act.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4.5 text-slate-850 dark:text-slate-250 font-bold max-w-[240px] truncate" title={act.desc}>
                    {act.desc}
                  </td>
                  <td className="px-6 py-4.5 text-slate-500 dark:text-slate-400 font-medium">
                    {act.date}
                  </td>
                  <td className="px-6 py-4.5 text-slate-500 dark:text-slate-400 font-mono">
                    {getGasLabel(act.gasUsed, act.txFrom)}
                  </td>
                  <td className="px-6 py-4.5 text-right">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-3xs font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 rounded-full border border-emerald-100/60 dark:border-emerald-900/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Success
                    </span>
                  </td>
                </tr>
              ))}

              {paginatedActivities.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-450 dark:text-slate-550 font-medium bg-white dark:bg-slate-900">
                    No transactions found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer - Pagination */}
        {totalPages > 1 && (
          <div className="bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-850 px-6 py-4 flex items-center justify-between text-xs text-slate-455">
            <div>
              Showing <strong className="text-slate-800 dark:text-slate-300 font-bold">{startIndex + 1}</strong> to{' '}
              <strong className="text-slate-800 dark:text-slate-300 font-bold">{endIndex}</strong> of{' '}
              <strong className="text-slate-850 dark:text-slate-350 font-bold">{totalItems}</strong> entries
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-650 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 shrink-0" />
              </button>
              <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-white font-bold rounded-lg font-mono">
                {currentPage} / {totalPages}
              </div>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-650 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 shrink-0" />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
