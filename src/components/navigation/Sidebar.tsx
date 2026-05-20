import { useWallet } from '../../hooks/useWallet';
import { useClaims } from '../../hooks/useClaims';
import { sliceAddress } from '../../utils/format';
import {
  ShieldAlert,
  LayoutDashboard,
  Vault as VaultIcon,
  PlusCircle,
  Inbox,
  Activity,
  ShieldCheck,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (pageId: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export function Sidebar({ currentPage, onNavigate, collapsed, setCollapsed }: SidebarProps) {
  const { wallet, disconnectWallet } = useWallet();
  const { getInheritances } = useClaims();

  // Find how many claims are currently Locked (claimable) or Cooldown (in-progress)
  const claimableCount = getInheritances().filter(
    (c) => c.status === 'Locked' || c.status === 'Cooldown'
  ).length;

  const navItems = [
    { id: 'dashboard', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
    { id: 'vaults', icon: <VaultIcon className="w-5 h-5" />, label: 'My Vaults' },
    { id: 'create', icon: <PlusCircle className="w-5 h-5" />, label: 'Create Vault' },
    {
      id: 'heir',
      icon: <Inbox className="w-5 h-5" />,
      label: 'Heir Inbox',
      badge: claimableCount > 0 ? claimableCount : undefined,
    },
    { id: 'activity', icon: <Activity className="w-5 h-5" />, label: 'Activity' },
    { id: 'security', icon: <ShieldCheck className="w-5 h-5" />, label: 'Security' },
    { id: 'settings', icon: <Settings className="w-5 h-5" />, label: 'Settings' },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 h-screen z-40 bg-slate-900 text-slate-400 border-r border-slate-800 transition-all duration-350 flex flex-col p-4 select-none
        ${collapsed ? 'w-20' : 'w-64'}
      `}
    >
      {/* Brand area */}
      <div className="flex items-center justify-between pb-6 mb-4 border-b border-slate-800">
        <div
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-3 cursor-pointer select-none"
        >
          <div className="w-9 h-9 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center text-white shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
            <ShieldAlert className="w-5 h-5 fill-white/10" />
          </div>
          {!collapsed && (
            <span className="font-bold text-lg tracking-tight text-white">
              Aegis
            </span>
          )}
        </div>

        {/* Desktop Collapse Trigger button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex p-1 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 flex flex-col gap-1.5 overflow-y-auto pr-1">
        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`
                w-full flex items-center p-3 rounded-xl font-semibold text-sm transition-all duration-150 group cursor-pointer
                ${
                  isActive
                    ? 'bg-blue-600/10 text-blue-400 shadow-xs'
                    : 'hover:bg-slate-800/50 hover:text-slate-200'
                }
                ${collapsed ? 'justify-center' : 'justify-between'}
              `}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`transition-colors shrink-0 ${
                    isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'
                  }`}
                >
                  {item.icon}
                </span>
                {!collapsed && <span>{item.label}</span>}
              </div>

              {!collapsed && item.badge !== undefined && (
                <span className="bg-rose-500 text-white font-bold text-2xs px-2 py-0.5 rounded-full animate-pulse shrink-0">
                  {item.badge}
                </span>
              )}

              {collapsed && item.badge !== undefined && (
                <div className="absolute left-14 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-900" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Profile & wallet info */}
      {wallet.connected && wallet.address && (
        <div className="mt-auto border-t border-slate-800 pt-4 flex flex-col gap-3">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-9 h-9 rounded-full bg-blue-950/80 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 select-none">
              <UserIcon className="w-4.5 h-4.5" />
            </div>
            {!collapsed && (
              <div className="flex flex-col text-left overflow-hidden">
                <span className="font-bold text-xs text-slate-250 truncate">
                  Alex Web3
                </span>
                <span className="text-[10px] text-emerald-450 font-mono tracking-tight flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  {sliceAddress(wallet.address)}
                </span>
              </div>
            )}
          </div>

          {!collapsed && (
            <button
              onClick={disconnectWallet}
              className="w-full flex items-center justify-center gap-2 p-2 bg-slate-800/40 text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-xl text-xs font-bold border border-slate-800 hover:border-rose-900/30 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Disconnect Wallet</span>
            </button>
          )}
        </div>
      )}
    </aside>
  );
}
