import { useEffect, useMemo, useState } from 'react';
import { useVaults } from '../../hooks/useVaults';
import { formatTimeRemaining } from '../../utils/format';
import { Button } from '../ui/Button';
import { Heart, Activity, AlertOctagon } from 'lucide-react';

interface HeartbeatPanelProps {
  onConfigureTimer: () => void;
}

function getUnlockTimestamp(vault: ReturnType<typeof useVaults>['vaults'][number]) {
  return vault.unlockTimestamp ?? (
    vault.lastPingTimestamp +
    (vault.inactivityDelaySeconds ?? vault.inactivityDays * 24 * 3600) * 1000
  );
}

export function HeartbeatPanel({ onConfigureTimer }: HeartbeatPanelProps) {
  const { vaults, pingVault, isLoading } = useVaults();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const ticker = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(ticker);
  }, []);

  const criticalVault = useMemo(() => {
    const activeVaults = vaults.filter((vault) => vault.status === 'Active');

    if (activeVaults.length === 0) return undefined;

    return [...activeVaults].sort(
      (left, right) => getUnlockTimestamp(left) - getUnlockTimestamp(right),
    )[0];
  }, [vaults]);

  const remainingSeconds = criticalVault
    ? Math.max(0, Math.ceil((getUnlockTimestamp(criticalVault) - now) / 1000))
    : 0;

  if (!criticalVault) {
    return (
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-6 md:p-8 flex flex-col justify-center items-center text-center h-full min-h-[220px]">
        <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-4 shrink-0">
          <Activity className="w-5.5 h-5.5" />
        </div>
        <h4 className="text-lg font-bold text-white mb-2">No Active Inactivity Timers</h4>
        <p className="text-sm text-slate-400 max-w-sm">Create an active vault to begin monitoring your proof-of-life window from the smart contract.</p>
      </div>
    );
  }

  const handleHeartbeat = async () => {
    await pingVault(criticalVault.id);
  };

  const isWarning = remainingSeconds < 3 * 24 * 3600; // less than 3 days
  const isDanger = remainingSeconds < 24 * 3600; // less than 24 hours

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 text-white rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden flex flex-col justify-between h-full min-h-[260px]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10 h-full w-full">
        {/* Core details */}
        <div className="flex flex-col text-left max-w-md">
          <span className="text-2xs font-bold uppercase tracking-widest text-slate-450 flex items-center gap-1.5 mb-3.5">
            <span className={`w-2 h-2 rounded-full shrink-0 ${isDanger ? 'bg-rose-500 animate-ping' : isWarning ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
            Proof of Life Pulse
          </span>
          <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white mb-2.5 flex items-center gap-2">
            <Heart className={`w-5.5 h-5.5 shrink-0 ${isDanger ? 'text-rose-500 animate-[pulse_1s_infinite]' : isWarning ? 'text-amber-500 animate-[pulse_1.5s_infinite]' : 'text-rose-500'}`} />
            {isDanger ? 'Critical Action Required' : isWarning ? 'Heartbeat Recommended' : 'Legacy Protected'}
          </h3>
          <p className="text-xs md:text-sm text-slate-400 leading-relaxed mb-6">
            Vault <strong className="text-blue-400 font-semibold">{criticalVault.name}</strong> requires a signature within the remaining window to verify your status and prevent beneficiary key release.
          </p>

          <div className="flex items-center gap-4">
            <Button
              variant="primary"
              loading={isLoading}
              onClick={handleHeartbeat}
              className="shadow-lg shadow-blue-500/10 shrink-0 text-xs px-4.5 py-2.5"
            >
              Send Heartbeat
            </Button>
            <button
              onClick={onConfigureTimer}
              className="text-xs font-bold text-slate-400 hover:text-white hover:underline transition-colors shrink-0 cursor-pointer"
            >
              Configure Thresholds
            </button>
          </div>
        </div>

        {/* Countdown layout */}
        <div className="flex flex-col md:items-end md:text-right shrink-0 py-2 border-t border-slate-800 md:border-t-0 md:pt-0 pt-4">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-1 justify-end mb-1">
            {isDanger && <AlertOctagon className="w-3.5 h-3.5 text-rose-500 animate-bounce" />}
            Remaining Safety Window
          </span>
          <div
            className={`font-mono text-3xl md:text-4xl font-extrabold tracking-tight select-none tabular-nums
              ${isDanger ? 'text-rose-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.2)]' : isWarning ? 'text-amber-550' : 'text-slate-105'}
            `}
          >
            {formatTimeRemaining(remainingSeconds)}
          </div>
          <span className="text-[10px] text-slate-500 mt-2 font-medium">
            Beneficiary Address: <code className="text-slate-400 font-mono text-[10px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">{criticalVault.heir.slice(0, 6)}...{criticalVault.heir.slice(-4)}</code>
          </span>
        </div>
      </div>
    </div>
  );
}
