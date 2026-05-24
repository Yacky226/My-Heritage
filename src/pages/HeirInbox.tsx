import { useWallet } from '../hooks/useWallet';
import { useClaims } from '../hooks/useClaims';
import { HeirVaultCard } from '../components/heir/HeirVaultCard';
import { EmptyState } from '../components/ui/EmptyState';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Shield, Sparkles, Inbox, Wallet, RefreshCw } from 'lucide-react';
import { sliceAddress } from '../utils/format';

interface HeirInboxProps {
  onNavigate: (pageId: string) => void;
}

export function HeirInbox({ onNavigate: _onNavigate }: HeirInboxProps) {
  const { wallet, connectWallet } = useWallet();
  const { getInheritances, isLoading, refetch } = useClaims();

  const inheritances = getInheritances();
  const showInitialLoading = wallet.connected && isLoading && inheritances.length === 0;

  return (
    <div className="flex flex-col gap-8 text-left select-none">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-6">
        <div>
          <div className="flex gap-2 text-xs text-slate-400 dark:text-slate-500 font-semibold mb-2 uppercase tracking-widest">
            <span>Home</span>
            <span>/</span>
            <span className="text-blue-500">Heir Inbox</span>
          </div>
          <h1 className="text-2xl md:text-3.5xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Inbox className="w-7 h-7 text-blue-500" />
            Heir Inbox & Claims
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-405 leading-relaxed mt-1">
            Access secure digital packages designated to you. Submit claims when inactivity conditions are met.
          </p>
        </div>
        {wallet.connected && (
          <Button
            variant="secondary"
            size="sm"
            onClick={refetch}
            loading={isLoading}
            icon={<RefreshCw className="w-4 h-4 shrink-0" />}
            className="shadow-sm shrink-0"
          >
            Refresh
          </Button>
        )}
      </div>

      {/* Info Notice Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        <Card className="md:col-span-2 border-slate-100/70 bg-gradient-to-r from-blue-50/50 via-cyan-50/20 to-transparent dark:from-slate-900 dark:to-slate-950 p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
            <Shield className="w-5.5 h-5.5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-950 dark:text-white">How Inheritance Claims Work</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1.5">
              Aegis Protocol monitors owner wallet activity. If an owner's inactivity timer expires, the vault locks.
              As the designated heir, you can trigger a smart contract claim directly from this inbox. The contract
              verifies the timestamp on-chain before allowing access to the recovery flow.
            </p>
          </div>
        </Card>

        <Card className="border-slate-100/70 bg-gradient-to-r from-purple-50/30 to-transparent dark:from-slate-900 dark:to-slate-950 p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0">
            <Sparkles className="w-5.5 h-5.5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-950 dark:text-white">Local-First Privacy</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1.5">
              Aegis never stores passwords or private file keys. Decryption occurs strictly inside your browser
              using the heir private encryption key after the on-chain claim succeeds.
            </p>
          </div>
        </Card>
      </div>

      {/* Main Content Area */}
      {!wallet.connected ? (
        <div className="mt-4">
          <EmptyState
            title="Wallet Disconnected"
            description="Please connect your Web3 wallet to verify designated digital inheritance plans registered to your public address."
            actionText="Connect Wallet"
            onAction={() => connectWallet('MetaMask')}
            icon={<Wallet className="w-12 h-12 text-slate-350 dark:text-slate-600 animate-pulse" />}
          />
        </div>
      ) : showInitialLoading ? (
        <div className="mt-4">
          <EmptyState
            title="Loading Heir Designations"
            description={`Reading the AegisVault contract for inheritances assigned to ${sliceAddress(wallet.address || '')}.`}
            icon={<RefreshCw className="w-12 h-12 text-slate-350 dark:text-slate-600 animate-spin" />}
          />
        </div>
      ) : inheritances.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="Inbox Empty"
            description={`No inheritance packages found for the currently connected wallet (${sliceAddress(wallet.address || '')}).`}
            actionText="Reconnect Wallet"
            onAction={() => connectWallet('MetaMask')}
            icon={<Inbox className="w-12 h-12 text-slate-350 dark:text-slate-600" />}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-bold text-slate-450 uppercase tracking-widest font-mono">
              Active Beneficiary Designations ({inheritances.length})
            </span>
            <span className="text-2xs text-slate-400 font-medium">
              Connected Address: <code className="bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded font-mono font-bold text-slate-700 dark:text-slate-300">{sliceAddress(wallet.address || '')}</code>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {inheritances.map((claim) => (
              <div key={claim.vaultId} className="h-full">
                <HeirVaultCard claim={claim} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
