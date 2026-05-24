import { useCallback, useEffect, useState } from 'react';
import { usePublicClient } from 'wagmi';
import { formatUnits } from 'viem';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useToast } from '../hooks/useToast';
import { useWallet } from '../hooks/useWallet';
import { useAegisNotifications } from '../hooks/useAegisNotifications';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Gauge,
  CheckCircle,
  HelpCircle,
  Mail,
  Smartphone,
  Globe,
  Wallet,
  Copy,
  RefreshCw,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import { sliceAddress } from '../utils/format';

interface SettingsProps {
  onNavigate: (pageId: string) => void;
}

type NetworkSnapshot = {
  blockNumber: bigint;
  gasPriceWei: bigint;
  checkedAt: number;
};

function getInAppNotificationKey(address?: string | null) {
  return address
    ? `aegis:in-app-notifications-enabled:${address.toLowerCase()}`
    : 'aegis:in-app-notifications-enabled:disconnected';
}

function getDismissedNotificationsKey(address?: string | null) {
  return address
    ? `aegis:dismissed-notifications:${address.toLowerCase()}`
    : 'aegis:dismissed-notifications:disconnected';
}

function readInAppNotificationsEnabled(storageKey: string) {
  if (typeof window === 'undefined') return true;
  return window.localStorage.getItem(storageKey) !== 'false';
}

function writeInAppNotificationsEnabled(storageKey: string, enabled: boolean) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(storageKey, String(enabled));
  window.dispatchEvent(new Event('aegis-settings-updated'));
}

function clearDismissedNotifications(storageKey: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(storageKey);
  window.dispatchEvent(new Event('aegis-settings-updated'));
}

function formatGwei(value: bigint) {
  const gwei = Number(formatUnits(value, 9));
  return `${gwei.toFixed(gwei >= 1 ? 2 : 4)} Gwei`;
}

export function Settings({ onNavigate }: SettingsProps) {
  const { addToast } = useToast();
  const { wallet, connectWallet } = useWallet();
  const publicClient = usePublicClient();
  const { unreadCount, urgentCount, isLoading: notificationsLoading } = useAegisNotifications();

  const notificationPreferenceKey = getInAppNotificationKey(wallet.address);
  const dismissedNotificationsKey = getDismissedNotificationsKey(wallet.address);
  const [, setSettingsRevision] = useState(0);
  const inAppNotificationsEnabled = readInAppNotificationsEnabled(notificationPreferenceKey);
  const [networkSnapshot, setNetworkSnapshot] = useState<NetworkSnapshot | null>(null);
  const [networkError, setNetworkError] = useState('');
  const [isRefreshingNetwork, setIsRefreshingNetwork] = useState(false);

  const refreshNetworkSnapshot = useCallback(async () => {
    if (!publicClient) {
      setNetworkSnapshot(null);
      setNetworkError('No active RPC client available.');
      return;
    }

    try {
      setIsRefreshingNetwork(true);
      setNetworkError('');

      const [gasPriceWei, blockNumber] = await Promise.all([
        publicClient.getGasPrice(),
        publicClient.getBlockNumber(),
      ]);

      setNetworkSnapshot({
        gasPriceWei,
        blockNumber,
        checkedAt: Date.now(),
      });
    } catch (error) {
      console.error(error);
      setNetworkError(error instanceof Error ? error.message : 'Unable to read RPC fee data.');
    } finally {
      setIsRefreshingNetwork(false);
    }
  }, [publicClient]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      refreshNetworkSnapshot();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [refreshNetworkSnapshot]);

  const handleToggleInAppNotifications = () => {
    const nextValue = !inAppNotificationsEnabled;
    writeInAppNotificationsEnabled(notificationPreferenceKey, nextValue);
    setSettingsRevision((value) => value + 1);
    addToast(
      nextValue ? 'In-app protocol notifications enabled' : 'In-app protocol notifications disabled',
      'success',
      2000,
    );
  };

  const handleClearDismissedNotifications = () => {
    clearDismissedNotifications(dismissedNotificationsKey);
    addToast('Dismissed notifications reset for this wallet', 'success', 2000);
  };

  const handleCopyAddress = () => {
    if (!wallet.address) return;
    navigator.clipboard.writeText(wallet.address);
    addToast('Wallet address copied', 'success', 1500);
  };

  return (
    <div className="flex flex-col gap-8 text-left select-none">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-6">
        <div>
          <div className="flex gap-2 text-xs text-slate-400 dark:text-slate-500 font-semibold mb-2 uppercase tracking-widest">
            <span>Home</span>
            <span>/</span>
            <span className="text-blue-500">Settings</span>
          </div>
          <h1 className="text-2xl md:text-3.5xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <SettingsIcon className="w-7 h-7 text-blue-500" />
            Control Center
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-405 leading-relaxed mt-1">
            Manage wallet-scoped preferences, notification visibility, and live RPC fee data.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <Card className="border-slate-100/70 p-6">
            <CardHeader className="border-none pb-0">
              <CardTitle icon={<User className="w-5 h-5 text-blue-500" />}>
                Wallet Identity
              </CardTitle>
            </CardHeader>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Aegis does not maintain an off-chain profile here. Identity is derived from the connected wallet.
            </p>

            <div className="mt-6 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center pb-4 border-b border-slate-100 dark:border-slate-800/50">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 dark:bg-slate-950 border border-slate-800 flex items-center justify-center text-blue-400 shrink-0">
                  <Wallet className="w-7 h-7" />
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {wallet.connected ? wallet.provider ?? 'Injected Wallet' : 'Wallet Disconnected'}
                  </span>
                  <span className="text-2xs text-slate-400 font-medium">
                    Public address:{' '}
                    <code className="bg-slate-50 dark:bg-slate-800/60 px-1.5 py-0.5 rounded font-mono font-bold text-slate-655">
                      {wallet.address ? sliceAddress(wallet.address) : 'Not connected'}
                    </code>
                  </span>
                  <span className="text-2xs text-slate-400 font-medium">
                    Active network:{' '}
                    <strong className="text-slate-650 dark:text-slate-300">{wallet.network}</strong>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleCopyAddress}
                  disabled={!wallet.address}
                  icon={<Copy className="w-4 h-4" />}
                  className="text-xs font-bold"
                >
                  Copy Wallet Address
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate('security')}
                  icon={<ShieldCheck className="w-4 h-4" />}
                  className="text-xs font-bold"
                >
                  Open Security Keys
                </Button>
              </div>

              {!wallet.connected && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => connectWallet('MetaMask')}
                  icon={<Wallet className="w-4 h-4" />}
                  className="text-xs font-bold self-start"
                >
                  Connect Wallet
                </Button>
              )}
            </div>
          </Card>

          <Card className="border-slate-100/70 p-6">
            <CardHeader className="border-none pb-0">
              <CardTitle icon={<Bell className="w-5 h-5 text-blue-500" />}>
                Notification Center
              </CardTitle>
            </CardHeader>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              These settings affect the local app notification drawer for the connected wallet.
            </p>

            <div className="mt-6 flex flex-col gap-3.5">
              <div className="p-3.5 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-4 text-xs font-medium">
                <div className="flex gap-3">
                  <Globe className="w-4.5 h-4.5 text-blue-500 shrink-0" />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-slate-900 dark:text-white">In-App Protocol Notifications</span>
                    <span className="text-3xs text-slate-450">
                      Shows wallet-scoped vault, claim, and activity alerts in the header.
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={inAppNotificationsEnabled}
                  onChange={handleToggleInAppNotifications}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer shrink-0"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800/80 text-xs">
                  <span className="text-3xs text-slate-450 uppercase tracking-widest font-bold">Current Queue</span>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {notificationsLoading ? 'Reading...' : `${unreadCount} visible`}
                    </span>
                    <span className="text-rose-500 font-bold">{urgentCount} urgent</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleClearDismissedNotifications}
                  className="text-xs font-bold min-h-[4.25rem]"
                >
                  Reset Cleared Notifications
                </Button>
              </div>

              <div className="p-3.5 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800/80 flex items-start gap-3 text-xs font-medium">
                <Mail className="w-4.5 h-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-slate-900 dark:text-white">Email Channel</span>
                  <span className="text-3xs text-slate-450">
                    Not configured. This frontend has no backend mail relay, so no email address is stored here.
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800/80 flex items-start gap-3 text-xs font-medium">
                <Smartphone className="w-4.5 h-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-slate-900 dark:text-white">Telegram / SMS Channel</span>
                  <span className="text-3xs text-slate-450">
                    Not connected. External messaging requires a server-side integration before it can be enabled.
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <Card className="border-slate-100/70 p-6 flex flex-col justify-between h-full">
            <div>
              <CardHeader className="flex items-center justify-between border-none pb-0">
                <CardTitle icon={<Gauge className="w-5 h-5 text-blue-500" />}>
                  Network Fees
                </CardTitle>
                <span title="Live RPC fee data">
                  <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
                </span>
              </CardHeader>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Gas prices are read from the active RPC. The wallet still estimates and confirms final fees per transaction.
              </p>

              <div className="mt-6 flex flex-col gap-3 font-medium">
                <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 text-xs">
                  <span className="text-3xs text-slate-450 uppercase tracking-widest font-bold">RPC Network</span>
                  <strong className="text-slate-900 dark:text-white font-bold block mt-1">{wallet.network}</strong>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 text-xs">
                  <span className="text-3xs text-slate-450 uppercase tracking-widest font-bold">Latest Block</span>
                  <strong className="text-slate-900 dark:text-white font-bold block mt-1">
                    {networkSnapshot ? networkSnapshot.blockNumber.toString() : 'Unavailable'}
                  </strong>
                </div>

                <div className="p-3.5 rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/20 dark:bg-blue-950/10 text-xs">
                  <span className="text-3xs text-slate-450 uppercase tracking-widest font-bold">Current Gas Price</span>
                  <strong className="text-blue-600 dark:text-blue-400 font-extrabold block mt-1">
                    {networkSnapshot ? formatGwei(networkSnapshot.gasPriceWei) : 'Unavailable'}
                  </strong>
                  <span className="text-[10px] text-slate-450 block mt-1">
                    {networkSnapshot ? `Checked ${new Date(networkSnapshot.checkedAt).toLocaleTimeString()}` : 'Waiting for RPC data'}
                  </span>
                </div>

                {networkError && (
                  <div className="p-3 rounded-xl border border-rose-100 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/15 text-xs text-rose-700 dark:text-rose-350 leading-relaxed">
                    {networkError}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-5">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={refreshNetworkSnapshot}
                loading={isRefreshingNetwork}
                icon={<RefreshCw className="w-4 h-4" />}
                className="text-xs font-bold"
              >
                Refresh RPC Snapshot
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onNavigate('activity')}
                icon={<Activity className="w-4 h-4" />}
                className="text-xs font-bold"
              >
                Open My Activity Ledger
              </Button>
              <div className="p-3 bg-blue-50/30 dark:bg-slate-900/60 rounded-2xl border border-blue-100/50 dark:border-slate-850 text-3xs text-slate-450 leading-relaxed font-mono flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                Gas priority is controlled by the connected wallet at signing time.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
