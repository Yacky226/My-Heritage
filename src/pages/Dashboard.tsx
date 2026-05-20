import { useVaults } from '../hooks/useVaults';
import { useClaims } from '../hooks/useClaims';
import { StatCard } from '../components/dashboard/StatCard';
import { HeartbeatPanel } from '../components/dashboard/HeartbeatPanel';
import { ActivityTimeline } from '../components/dashboard/ActivityTimeline';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { sliceAddress } from '../utils/format';
import {
  Vault,
  Users,
  ShieldCheck,
  Fuel,
  Plus,
  ArrowUpRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (pageId: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { vaults } = useVaults();
  const { getInheritances } = useClaims();

  // Compute actual dynamic statistics based on loaded vaults state!
  const totalVaults = vaults.length;
  
  // Count unique heir addresses
  const uniqueHeirs = Array.from(new Set(vaults.map((v) => v.heir.toLowerCase()))).length;
  
  // Calculate average security score based on number of configured parameters
  let securityScore = 0;
  if (totalVaults > 0) {
    const totalPossiblePoints = totalVaults * 3;
    let earnedPoints = 0;
    vaults.forEach((v) => {
      if (v.inactivityDays > 0) earnedPoints++;
      if (v.heir) earnedPoints++;
      if (v.files && v.files.length > 0) earnedPoints++;
    });
    securityScore = Math.round((earnedPoints / totalPossiblePoints) * 100);
  } else {
    securityScore = 0;
  }

  // Count how many inheritances are pending claim in the inbox
  const claimableCount = getInheritances().filter(
    (c) => c.status === 'Locked' || c.status === 'Cooldown'
  ).length;

  return (
    <div className="flex flex-col gap-8 text-left select-none">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-6">
        <div>
          <div className="flex gap-2 text-xs text-slate-400 dark:text-slate-500 font-semibold mb-2 uppercase tracking-widest">
            <span>Home</span>
            <span>/</span>
            <span className="text-blue-500">Dashboard</span>
          </div>
          <h1 className="text-2xl md:text-3.5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Security Overview
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-405 leading-relaxed mt-1">
            Welcome back, <strong className="text-slate-800 dark:text-slate-200 font-semibold">Alex Web3</strong>. Your cryptographic heritage is secure and monitored.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => onNavigate('create')}
          icon={<Plus className="w-4 h-4 shrink-0" />}
          className="shadow-md shadow-blue-500/10"
        >
          New Digital Vault
        </Button>
      </div>

      {/* Claim alerts if beneficiary claims are pending! */}
      {claimableCount > 0 && (
        <Card
          glow
          className="bg-rose-50/50 dark:bg-rose-950/15 border-rose-200/50 dark:border-rose-900/40 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
              <AlertCircle className="w-5 h-5 animate-bounce" />
            </div>
            <div className="text-left">
              <h5 className="font-extrabold text-sm text-rose-800 dark:text-rose-350">
                Beneficiary Action Required
              </h5>
              <p className="text-xs text-rose-600 dark:text-rose-400 leading-relaxed mt-0.5">
                You have <strong className="font-semibold">{claimableCount} pending inheritance vault claim{claimableCount > 1 ? 's' : ''}</strong> ready to unseal in your inbox.
              </p>
            </div>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => onNavigate('heir')}
            className="text-xs px-4 py-2 hover:bg-rose-100"
          >
            Access Heir Inbox
          </Button>
        </Card>
      )}

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
        <StatCard
          label="Total Secure Vaults"
          value={totalVaults}
          icon={<Vault className="w-5.5 h-5.5" />}
          trend="1 active this month"
          trendType="positive"
          color="blue"
        />
        <StatCard
          label="Heirs Designated"
          value={uniqueHeirs}
          icon={<Users className="w-5.5 h-5.5" />}
          trend="On-chain registry synchronized"
          trendType="neutral"
          color="emerald"
        />
        <StatCard
          label="Security Health Score"
          value={`${securityScore}%`}
          icon={<ShieldCheck className="w-5.5 h-5.5" />}
          trend="Health check: Excellent"
          trendType="positive"
          color="purple"
        />
        <StatCard
          label="Gas Spent (All-Time)"
          value="0.384 ETH"
          icon={<Fuel className="w-5.5 h-5.5" />}
          trend="Avg 0.0024 ETH per heartbeat"
          trendType="neutral"
          color="rose"
        />
      </div>

      {/* Middle Layout Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-stretch">
        {/* Critical heartbeat timer action widget */}
        <div className="lg:col-span-8 flex flex-col">
          <HeartbeatPanel onConfigureTimer={() => onNavigate('settings')} />
        </div>

        {/* Recent Audit Ledger */}
        <div className="lg:col-span-4 flex flex-col">
          <Card className="border-slate-100/70 flex flex-col justify-between h-full">
            <div>
              <CardHeader className="flex items-center justify-between">
                <CardTitle icon={<TrendingUp className="w-5 h-5" />}>
                  Recent Activity
                </CardTitle>
                <button
                  onClick={() => onNavigate('activity')}
                  className="text-2xs font-extrabold text-blue-500 hover:underline cursor-pointer"
                >
                  View All
                </button>
              </CardHeader>
              <div className="mt-4">
                <ActivityTimeline />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Vault Preview Table */}
      <Card className="border-slate-100/70 w-full overflow-hidden">
        <CardHeader className="flex justify-between items-center pb-2">
          <CardTitle icon={<Vault className="w-5 h-5" />}>
            Active Legacy Vaults
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('vaults')}
            className="text-xs font-bold text-slate-500 hover:text-slate-900"
            icon={<ArrowUpRight className="w-4 h-4 shrink-0" />}
          >
            Manage All Vaults
          </Button>
        </CardHeader>

        <div className="overflow-x-auto -mx-6 mt-3">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-950/60 text-left">
                <tr>
                  <th className="px-6 py-4.5 text-3xs font-extrabold uppercase tracking-widest text-slate-450">
                    Vault Config Name
                  </th>
                  <th className="px-6 py-4.5 text-3xs font-extrabold uppercase tracking-widest text-slate-450">
                    Heir Address (Beneficiary)
                  </th>
                  <th className="px-6 py-4.5 text-3xs font-extrabold uppercase tracking-widest text-slate-450">
                    Safety Status
                  </th>
                  <th className="px-6 py-4.5 text-3xs font-extrabold uppercase tracking-widest text-slate-450">
                    File Package Specs
                  </th>
                  <th className="px-6 py-4.5 text-3xs font-extrabold uppercase tracking-widest text-slate-450">
                    Inactivity Threshold
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-slate-900">
                {vaults.slice(0, 3).map((v) => (
                  <tr
                    key={v.id}
                    onClick={() => onNavigate('vaults')}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-850/40 transition-colors cursor-pointer text-xs"
                  >
                    <td className="px-6 py-4 font-bold text-slate-850 dark:text-slate-200">
                      {v.name}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-500 dark:text-slate-400">
                      {sliceAddress(v.heir)}
                    </td>
                    <td className="px-6 py-4">
                      <Badge status={v.status} />
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium">
                      {v.fileCount} file{v.fileCount > 1 ? 's' : ''} ({v.fileSize})
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">
                      {v.inactivityTimer}
                    </td>
                  </tr>
                ))}
                
                {vaults.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400 dark:text-slate-500 font-medium">
                      No digital vaults deployed. Click "New Digital Vault" to start your legacy setup.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
}
