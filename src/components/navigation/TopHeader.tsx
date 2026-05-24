import { useEffect, useState } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { useToast } from '../../hooks/useToast';
import { useAegisNotifications } from '../../hooks/useAegisNotifications';
import { sliceAddress } from '../../utils/format';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import {
  Globe,
  Bell,
  Wallet,
  Menu,
  ChevronDown,
  CheckCircle
} from 'lucide-react';

interface TopHeaderProps {
  onMenuToggle: () => void;
  onNavigate: (pageId: string) => void;
}

function readDismissedNotificationIds(storageKey: string) {
  if (typeof window === 'undefined') return new Set<string>();

  try {
    const storedValue = window.localStorage.getItem(storageKey);
    const parsedValue = storedValue ? JSON.parse(storedValue) : [];
    return new Set(Array.isArray(parsedValue) ? parsedValue.filter((id) => typeof id === 'string') : []);
  } catch (error) {
    console.error(error);
    return new Set<string>();
  }
}

function writeDismissedNotificationIds(storageKey: string, ids: Set<string>) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(storageKey, JSON.stringify(Array.from(ids)));
}

export function TopHeader({ onMenuToggle, onNavigate }: TopHeaderProps) {
  const { wallet, connectWallet, switchNetwork, isConnecting, supportedNetworks } = useWallet();
  const { addToast } = useToast();
  const { notifications, isLoading: notificationsLoading } = useAegisNotifications();
  
  const [networkOpen, setNetworkOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [, setDismissedRevision] = useState(0);

  const notificationStorageKey = wallet.address
    ? `aegis:dismissed-notifications:${wallet.address.toLowerCase()}`
    : 'aegis:dismissed-notifications:disconnected';
  const dismissedNotificationIds = readDismissedNotificationIds(notificationStorageKey);
  const visibleNotifications = notifications.filter(
    (notification) => !dismissedNotificationIds.has(notification.id),
  );
  const visibleUrgentCount = visibleNotifications.filter((notification) => notification.urgent).length;

  useEffect(() => {
    const refreshDismissedState = () => setDismissedRevision((value) => value + 1);
    window.addEventListener('aegis-settings-updated', refreshDismissedState);
    return () => window.removeEventListener('aegis-settings-updated', refreshDismissedState);
  }, []);

  const handleWalletSelect = async (provider: string) => {
    setWalletModalOpen(false);
    await connectWallet(provider);
  };

  const handleNetworkSelect = async (chainId: number) => {
    await switchNetwork(chainId);
    setNetworkOpen(false);
  };

  const handleClearNotifications = () => {
    const nextDismissedIds = new Set(dismissedNotificationIds);

    notifications.forEach((notification) => nextDismissedIds.add(notification.id));
    writeDismissedNotificationIds(notificationStorageKey, nextDismissedIds);
    setDismissedRevision((value) => value + 1);
    setNotificationsOpen(false);
    addToast('Notifications cleared', 'success');
  };

  const handleNotificationClick = (pageId: string) => {
    onNavigate(pageId);
    setNotificationsOpen(false);
  };

  return (
    <header className="h-[76px] px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/80 sticky top-0 z-30 flex items-center justify-between">
      {/* Network and Left options */}
      <div className="flex items-center gap-4">
        {/* Mobile menu hamburger button */}
        <button
          onClick={onMenuToggle}
          className="p-2 md:hidden rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Network display and Switcher overlay */}
        {wallet.connected && (
          <div className="relative">
            <button
              onClick={() => setNetworkOpen(!networkOpen)}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-950/40 text-slate-650 dark:text-slate-350 rounded-full text-xs font-semibold border border-slate-100 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors select-none cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-blue-500" />
              <span>{wallet.network}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {networkOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setNetworkOpen(false)} />
                <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-xl z-20 py-1.5 overflow-hidden">
                  {supportedNetworks.map((net) => (
                    <button
                      key={net.id}
                      onClick={() => handleNetworkSelect(net.id)}
                      disabled={isConnecting}
                      className={`w-full text-left px-4 py-2 text-xs font-semibold transition-colors flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer
                        ${
                          wallet.network === net.name
                            ? 'text-blue-500 dark:text-blue-400 bg-blue-50/20 dark:bg-blue-950/10'
                            : 'text-slate-600 dark:text-slate-400'
                        }
                      `}
                    >
                      <span>{net.name}</span>
                      {wallet.network === net.name && <CheckCircle className="w-3.5 h-3.5 text-blue-500" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-3">
        {/* Notifications list overlay */}
        {wallet.connected && (
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="w-10 h-10 rounded-full border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer transition-colors relative"
            >
              <Bell className="w-4.5 h-4.5" />
              {visibleNotifications.length > 0 && (
                <span className={`absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full border border-white dark:border-slate-900 text-[10px] leading-5 text-white font-extrabold text-center ${
                  visibleUrgentCount > 0 ? 'bg-rose-500 animate-pulse' : 'bg-blue-500'
                }`}>
                  {Math.min(visibleNotifications.length, 9)}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setNotificationsOpen(false)} />
                <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl z-20 py-3 overflow-hidden text-left">
                  <div className="px-4 pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">Notifications</span>
                    <button
                      onClick={handleClearNotifications}
                      disabled={visibleNotifications.length === 0}
                      className="text-2xs text-blue-500 hover:underline font-bold"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto px-2 flex flex-col gap-1">
                    {notificationsLoading && visibleNotifications.length === 0 && (
                      <div className="px-3 py-6 text-center text-xs text-slate-400 font-medium">
                        Reading on-chain activity...
                      </div>
                    )}

                    {!notificationsLoading && visibleNotifications.length === 0 && (
                      <div className="px-3 py-6 text-center text-xs text-slate-400 font-medium">
                        No live protocol notifications.
                      </div>
                    )}

                    {visibleNotifications.map((notif) => (
                      <button
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif.targetPage)}
                        className={`w-full text-left p-3 rounded-xl flex gap-2 text-xs transition-colors hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer
                          ${notif.urgent ? 'bg-rose-50/20 dark:bg-rose-950/5 border-l-2 border-l-rose-500' : ''}
                        `}
                      >
                        <div className="flex-1">
                          <div className="font-bold text-slate-800 dark:text-slate-200 flex justify-between">
                            <span>{notif.title}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{notif.time}</span>
                          </div>
                          <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{notif.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Wallet trigger button */}
        {wallet.connected && wallet.address ? (
          <div className="px-4 py-2 bg-slate-900 dark:bg-slate-950 text-white rounded-xl text-xs font-bold font-mono tracking-tight shadow-sm flex items-center gap-2 select-none border border-slate-800/40">
            <Wallet className="w-3.5 h-3.5 text-blue-400" />
            <span>{sliceAddress(wallet.address)}</span>
          </div>
        ) : (
          <Button
            size="sm"
            onClick={() => setWalletModalOpen(true)}
            icon={<Wallet className="w-4.5 h-4.5" />}
          >
            Connect Wallet
          </Button>
        )}
      </div>

      {/* Connect Wallet Modal Selection */}
      <Modal
        isOpen={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
        title="Connect Decentralized Wallet"
      >
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
          Select a wallet to access the Aegis Protocol digital inheritance network. Ensure your account has sufficient gas to execute heartbeats.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => handleWalletSelect('MetaMask')}
            disabled={isConnecting}
            className="flex items-center gap-4 p-4 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors w-full text-left cursor-pointer group disabled:opacity-50"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center shrink-0">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"
                className="w-7 h-7"
                alt="MetaMask"
              />
            </div>
            <div className="flex-1">
              <div className="font-bold text-sm text-slate-800 dark:text-slate-200 group-hover:text-blue-500 transition-colors">
                MetaMask
              </div>
              <p className="text-2xs text-slate-400 dark:text-slate-500">Connect via Metamask Browser extension</p>
            </div>
          </button>

          <button
            onClick={() => handleWalletSelect('WalletConnect')}
            disabled={isConnecting}
            className="flex items-center gap-4 p-4 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors w-full text-left cursor-pointer group disabled:opacity-50"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center shrink-0">
              <img
                src="https://avatars.githubusercontent.com/u/37784886?s=200&v=4"
                className="w-7 h-7 rounded-md"
                alt="WalletConnect"
              />
            </div>
            <div className="flex-1">
              <div className="font-bold text-sm text-slate-800 dark:text-slate-200 group-hover:text-blue-500 transition-colors">
                WalletConnect
              </div>
              <p className="text-2xs text-slate-400 dark:text-slate-500">Scan QR code using mobile device</p>
            </div>
          </button>

          <button
            onClick={() => handleWalletSelect('Coinbase')}
            disabled={isConnecting}
            className="flex items-center gap-4 p-4 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors w-full text-left cursor-pointer group disabled:opacity-50"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center shrink-0">
              <img
                src="https://avatars.githubusercontent.com/u/18060234?s=200&v=4"
                className="w-7 h-7 rounded-md"
                alt="Coinbase Wallet"
              />
            </div>
            <div className="flex-1">
              <div className="font-bold text-sm text-slate-800 dark:text-slate-200 group-hover:text-blue-500 transition-colors">
                Coinbase Wallet
              </div>
              <p className="text-2xs text-slate-400 dark:text-slate-500">Connect using Coinbase wallet extension or app</p>
            </div>
          </button>
        </div>
      </Modal>
    </header>
  );
}
