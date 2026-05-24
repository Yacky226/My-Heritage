import { useState } from 'react';
import { useVaults } from '../hooks/useVaults';
import type { Vault } from '../types';
import { VaultCard } from '../components/vault/VaultCard';
import { VaultItem } from '../components/vault/VaultItem';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { EmptyState } from '../components/ui/EmptyState';
import {
  LayoutGrid,
  List,
  Search,
  Plus,
  Vault as VaultIcon,
  FolderOpen,
  User,
  Clock,
  Heart,
  UserPlus,
  Trash2,
  FileText,
  Lock,
  RefreshCw
} from 'lucide-react';

interface VaultsProps {
  onNavigate: (pageId: string) => void;
}

export function Vaults({ onNavigate }: VaultsProps) {
  const { vaults, pingVault, updateVaultHeir, deleteVault, refetch, isLoading } = useVaults();
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Locked'>('All');
  
  // Selected vault for detailed modal view
  const [selectedVault, setSelectedVault] = useState<Vault | null>(null);
  
  // Heir edit state
  const [heirEditOpen, setHeirEditOpen] = useState(false);
  const [newHeirAddress, setNewHeirAddress] = useState('');
  const [heirError, setHeirError] = useState('');

  // Handle vault details drawer triggers
  const handleViewDetails = (vault: Vault) => {
    setSelectedVault(vault);
    setNewHeirAddress(vault.heir);
    setHeirEditOpen(false);
  };

  const handleEditHeir = (vault: Vault) => {
    setSelectedVault(vault);
    setNewHeirAddress(vault.heir);
    setHeirEditOpen(true);
  };

  const handleHeirUpdateSubmit = async () => {
    if (!selectedVault) return;
    if (!newHeirAddress.trim().startsWith('0x') || newHeirAddress.length !== 42) {
      setHeirError('Invalid address. Must be a 42-character Ethereum address (0x...)');
      return;
    }
    setHeirError('');
    const success = await updateVaultHeir(selectedVault.id, newHeirAddress);
    if (success) {
      setSelectedVault((prev) => prev ? { ...prev, heir: newHeirAddress } : null);
      setHeirEditOpen(false);
    }
  };

  const handleDetailsHeartbeat = async () => {
    if (!selectedVault) return;
    const success = await pingVault(selectedVault.id);
    if (success) {
      // Refresh status inside detail modal
      setSelectedVault((prev) => prev ? { ...prev, status: 'Active', lastPing: 'Just now' } : null);
    }
  };

  const handleDetailsDelete = () => {
    if (!selectedVault) return;
    if (confirm(`Are you sure you want to delete "${selectedVault.name}"? This action cannot be undone.`)) {
      deleteVault(selectedVault.id);
      setSelectedVault(null);
    }
  };

  // Filter vaults based on search inputs
  const filteredVaults = vaults.filter((vault) => {
    const matchesSearch = vault.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vault.heir.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || vault.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  const showInitialLoading = isLoading && vaults.length === 0;

  return (
    <div className="flex flex-col gap-8 text-left select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-6">
        <div>
          <div className="flex gap-2 text-xs text-slate-400 dark:text-slate-500 font-semibold mb-2 uppercase tracking-widest">
            <span className="cursor-pointer hover:text-blue-500" onClick={() => onNavigate('dashboard')}>Home</span>
            <span>/</span>
            <span className="text-blue-500">My Vaults</span>
          </div>
          <h1 className="text-2xl md:text-3.5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Digital Inheritance Vaults
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-405 mt-1 leading-relaxed">
            Manage files encrypted locally using AES-256 and configure secure, automated heir delivery smart contracts.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={refetch}
            loading={isLoading}
            icon={<RefreshCw className="w-4 h-4 shrink-0" />}
            className="shadow-sm"
          >
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => onNavigate('create')}
            icon={<Plus className="w-4 h-4 shrink-0" />}
            className="shadow-md shadow-blue-500/10"
          >
            Create Vault
          </Button>
        </div>
      </div>

      {/* Search and Filters bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-4 rounded-2xl w-full">
        {/* Search input field */}
        <div className="w-full md:max-w-md">
          <Input
            placeholder="Search by vault name or heir address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4 text-slate-400" />}
            className="py-2.5 text-xs bg-slate-50/50"
          />
        </div>

        {/* Tab Filters and View mode selectors */}
        <div className="flex items-center gap-4.5 justify-between w-full md:w-auto">
          <div className="flex bg-slate-50 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-100 dark:border-slate-850 gap-1 select-none">
            {(['All', 'Active', 'Locked'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer
                  ${
                    statusFilter === status
                      ? 'bg-white dark:bg-slate-900 text-blue-500 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }
                `}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="flex items-center border-l border-slate-200 dark:border-slate-800 pl-4.5 gap-1.5 shrink-0 select-none">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg cursor-pointer transition-colors
                ${viewMode === 'grid' ? 'bg-slate-50 dark:bg-slate-850 text-blue-500' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}
              `}
              title="Grid Layout"
            >
              <LayoutGrid className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg cursor-pointer transition-colors
                ${viewMode === 'list' ? 'bg-slate-50 dark:bg-slate-850 text-blue-500' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}
              `}
              title="List Layout"
            >
              <List className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Vault Grid/List display */}
      {showInitialLoading ? (
        <EmptyState
          icon={<RefreshCw className="w-8 h-8 text-slate-450 animate-spin" />}
          title="Loading On-Chain Vaults"
          description="Reading the AegisVault contract for vaults owned by the connected wallet."
        />
      ) : filteredVaults.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6.5 w-full">
            {filteredVaults.map((vault) => (
              <VaultCard
                key={vault.id}
                vault={vault}
                onViewDetails={handleViewDetails}
                onEditHeir={handleEditHeir}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3.5 w-full">
            {filteredVaults.map((vault) => (
              <VaultItem
                key={vault.id}
                vault={vault}
                onViewDetails={handleViewDetails}
                onEditHeir={handleEditHeir}
              />
            ))}
          </div>
        )
      ) : (
        <EmptyState
          icon={<FolderOpen className="w-8 h-8 text-slate-450" />}
          title="No Legacy Vaults Found"
          description={
            searchQuery || statusFilter !== 'All'
              ? 'No digital vaults match your active filter preferences or search query. Adjust inputs and try again.'
              : 'Create a highly secured digital vault to store passphrases, cold storage backups, passport credentials, or documents.'
          }
          actionText={!searchQuery && statusFilter === 'All' ? 'Initialize First Vault' : undefined}
          onAction={() => onNavigate('create')}
        />
      )}

      {/* Vault Details Modal drawer */}
      {selectedVault && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedVault(null)}
          title={`Vault Details: ${selectedVault.name}`}
          size="lg"
        >
          <div className="flex flex-col gap-6 select-none">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-50 dark:bg-slate-950/40 p-4 border border-slate-100 dark:border-slate-850 rounded-2xl text-left">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  On-Chain Status
                </span>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge status={selectedVault.status} />
                  <span className="text-2xs text-slate-450 font-medium">
                    (Last ping verification: {selectedVault.lastPing})
                  </span>
                </div>
              </div>

              {selectedVault.status === 'Active' && (
                <Button
                  variant="primary"
                  size="sm"
                  loading={isLoading}
                  onClick={handleDetailsHeartbeat}
                  className="text-xs px-4 py-2 hover:-translate-y-[1px]"
                  icon={<Heart className="w-3.5 h-3.5 fill-current" />}
                >
                  Trigger Proof of Life
                </Button>
              )}
            </div>

            {/* Description */}
            <div className="text-left">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block mb-1.5">
                Legacy Description
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-xl">
                {selectedVault.description || 'No descriptive context configured for this legacy vault.'}
              </p>
            </div>

            {/* Grid properties */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              <div className="p-4 bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-850 rounded-xl">
                <span className="text-4xs text-slate-450 uppercase tracking-widest font-bold block mb-1">
                  Inactivity Timer
                </span>
                <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-500 shrink-0" />
                  {selectedVault.inactivityTimer}
                </span>
              </div>
              
              <div className="p-4 bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-850 rounded-xl">
                <span className="text-4xs text-slate-450 uppercase tracking-widest font-bold block mb-1">
                  Storage Size
                </span>
                <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <VaultIcon className="w-4 h-4 text-blue-500 shrink-0" />
                  {selectedVault.fileSize}
                </span>
              </div>
              
              <div className="p-4 bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-850 rounded-xl">
                <span className="text-4xs text-slate-450 uppercase tracking-widest font-bold block mb-1">
                  Deployment Date
                </span>
                <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <FolderOpen className="w-4 h-4 text-blue-500 shrink-0" />
                  {selectedVault.createdAt}
                </span>
              </div>
            </div>

            {/* Heir Info Edit block */}
            <div className="text-left bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4.5 rounded-2xl flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block">
                  Beneficiary Registry
                </span>
                {!heirEditOpen && (
                  <button
                    onClick={() => setHeirEditOpen(true)}
                    className="text-2xs font-extrabold text-blue-500 hover:underline flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Re-assign Heir</span>
                  </button>
                )}
              </div>

              {heirEditOpen ? (
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-grow">
                    <Input
                      label="New Heir Wallet Address (0x...)"
                      placeholder="0x..."
                      value={newHeirAddress}
                      onChange={(e) => setNewHeirAddress(e.target.value)}
                      error={heirError}
                      className="py-2 text-xs"
                    />
                  </div>
                  <div className="flex gap-2 shrink-0 mb-0.5">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setHeirEditOpen(false)}
                      className="text-xs px-3.5 py-2.5"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleHeirUpdateSubmit}
                      className="text-xs px-4 py-2.5"
                    >
                      Update Registry
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-8.5 h-8.5 rounded-full bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-500 shrink-0 border border-slate-100">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <code className="text-xs font-bold font-mono tracking-tight text-slate-700 dark:text-slate-200">
                      {selectedVault.heir}
                    </code>
                    <span className="text-[9px] text-slate-450 dark:text-slate-500 mt-0.5">Authorized to claim and decrypt the IPFS payload</span>
                  </div>
                </div>
              )}
            </div>

            {/* List of files inside vault */}
            <div className="text-left">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block mb-2.5">
                Encrypted File Manifest ({selectedVault.files?.length || 1})
              </span>
              <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-850 bg-white dark:bg-slate-900">
                {selectedVault.files?.map((f, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 text-xs">
                    <span className="font-bold text-slate-750 dark:text-slate-250 flex items-center gap-2">
                      <FileText className="w-4.5 h-4.5 text-blue-500 shrink-0" />
                      {f.name}
                    </span>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-2xs font-semibold text-slate-400 font-mono">{f.size}</span>
                      <span className="text-4xs font-bold text-slate-400 bg-slate-50 dark:bg-slate-950 border border-slate-150 px-2 py-0.5 rounded-full uppercase shrink-0">
                        {f.type.split('/')[1]?.toUpperCase() || 'OCTET'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Warning block about local keys */}
            <Alert type="warning">
              <div className="flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-350">
                <Lock className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
                <p>
                  Files are stored as an encrypted IPFS payload. They can only be decrypted with the heir private encryption key after the inactivity threshold expires and the claim succeeds on-chain.
                </p>
              </div>
            </Alert>

            {/* Dangerous actions */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex justify-between gap-3">
              <Button
                variant="danger"
                size="sm"
                onClick={handleDetailsDelete}
                className="text-xs"
                icon={<Trash2 className="w-4 h-4 shrink-0" />}
              >
                Delete Digital Vault
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedVault(null)}
                className="text-xs px-5"
              >
                Close Drawer
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
