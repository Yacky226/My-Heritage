import { useMemo } from "react";
import { useVaults } from "../hooks/useVaults";
import { useClaims } from "../hooks/useClaims";
import { useWallet } from "../hooks/useWallet";
import { StatCard } from "../components/dashboard/StatCard";
import { HeartbeatPanel } from "../components/dashboard/HeartbeatPanel";
import { ActivityTimeline } from "../components/dashboard/ActivityTimeline";
import { Card, CardHeader, CardTitle } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { sliceAddress } from "../utils/format";
import {
  Vault,
  Users,
  ShieldCheck,
  Fuel,
  Plus,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

interface DashboardProps {
  onNavigate: (pageId: string) => void;
}

function parseGasUsed(gasUsed: string) {
  const normalized = gasUsed.replace(/[^\d]/g, "");
  return normalized ? Number(normalized) : 0;
}

function formatGasTotal(gas: number) {
  if (gas >= 1_000_000) return `${(gas / 1_000_000).toFixed(2)}M gas`;
  if (gas >= 1_000) return `${(gas / 1_000).toFixed(1)}K gas`;
  return `${gas.toLocaleString()} gas`;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { vaults, activities, isLoading } = useVaults();
  const { getInheritances } = useClaims();
  const { wallet } = useWallet();

  const inheritances = getInheritances();
  const totalVaults = vaults.length;
  const activeVaults = vaults.filter((vault) => vault.status === "Active").length;
  const claimableCount = inheritances.filter((claim) => claim.canClaim).length;

  const uniqueHeirs = Array.from(
    new Set(vaults.map((vault) => vault.heir.toLowerCase())),
  ).length;

  const securityScore = useMemo(() => {
    if (totalVaults === 0) return 0;

    const earnedPoints = vaults.reduce((score, vault) => {
      let nextScore = score;
      if (vault.heir) nextScore += 1;
      if (vault.ipfsCid || (vault.files && vault.files.length > 0)) nextScore += 1;
      if ((vault.inactivityDelaySeconds ?? 0) > 0) nextScore += 1;
      if (!vault.revoked && !vault.claimed) nextScore += 1;
      return nextScore;
    }, 0);

    return Math.round((earnedPoints / (totalVaults * 4)) * 100);
  }, [totalVaults, vaults]);

  const gasEvents = activities.filter((activity) => parseGasUsed(activity.gasUsed) > 0);
  const walletActionActivities = wallet.address
    ? gasEvents.filter((activity) => activity.txFrom?.toLowerCase() === wallet.address?.toLowerCase())
    : [];
  const walletGasUsed = walletActionActivities.reduce(
    (total, activity) => total + parseGasUsed(activity.gasUsed),
    0,
  );
  const averageGasUsed = walletActionActivities.length > 0
    ? Math.round(walletGasUsed / walletActionActivities.length)
    : 0;
  const userLabel = wallet.address
    ? sliceAddress(wallet.address)
    : "connect your wallet";

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
            Welcome back,{" "}
            <strong className="text-slate-800 dark:text-slate-200 font-semibold">
              {userLabel}
            </strong>
            . Your on-chain legacy vaults are synchronized from the active wallet.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => onNavigate("create")}
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
                You have{" "}
                <strong className="font-semibold">
                  {claimableCount} pending inheritance vault claim
                  {claimableCount > 1 ? "s" : ""}
                </strong>{" "}
                ready to unseal in your inbox.
              </p>
            </div>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => onNavigate("heir")}
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
          trend={
            isLoading
              ? "Synchronizing on-chain vaults"
              : `${activeVaults} active / ${Math.max(totalVaults - activeVaults, 0)} sealed`
          }
          trendType={activeVaults > 0 ? "positive" : "neutral"}
          color="blue"
        />
        <StatCard
          label="Heirs Designated"
          value={uniqueHeirs}
          icon={<Users className="w-5.5 h-5.5" />}
          trend={totalVaults > 0 ? "Unique beneficiary wallets" : "No beneficiaries registered"}
          trendType="neutral"
          color="emerald"
        />
        <StatCard
          label="Security Health Score"
          value={`${securityScore}%`}
          icon={<ShieldCheck className="w-5.5 h-5.5" />}
          trend={
            totalVaults === 0
              ? "Create a vault to start scoring"
              : securityScore >= 80
                ? "Health check: strong"
                : "Review vault configuration"
          }
          trendType={securityScore >= 80 ? "positive" : totalVaults > 0 ? "negative" : "neutral"}
          color="purple"
        />
        <StatCard
          label="Gas Used (Your Actions)"
          value={formatGasTotal(walletGasUsed)}
          icon={<Fuel className="w-5.5 h-5.5" />}
          trend={averageGasUsed > 0 ? `Avg ${formatGasTotal(averageGasUsed)} per tx` : "No wallet transactions yet"}
          trendType="neutral"
          color="rose"
        />
      </div>

      {/* Middle Layout Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-stretch">
        {/* Critical heartbeat timer action widget */}
        <div className="lg:col-span-8 flex flex-col">
          <HeartbeatPanel onConfigureTimer={() => onNavigate("settings")} />
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
                  onClick={() => onNavigate("activity")}
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
            onClick={() => onNavigate("vaults")}
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
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-normal text-slate-450">
                    Vault Config Name
                  </th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-normal text-slate-450">
                    Heir Address (Beneficiary)
                  </th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-normal text-slate-450">
                    Safety Status
                  </th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-normal text-slate-450">
                    File Package Specs
                  </th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-normal text-slate-450">
                    Inactivity Threshold
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-slate-900">
                {vaults.slice(0, 3).map((v) => (
                  <tr
                    key={v.id}
                    onClick={() => onNavigate("vaults")}
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
                      {v.fileCount} file{v.fileCount > 1 ? "s" : ""} (
                      {v.fileSize})
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">
                      {v.inactivityTimer}
                    </td>
                  </tr>
                ))}

                {vaults.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-slate-400 dark:text-slate-500 font-medium"
                    >
                      No digital vaults deployed. Click "New Digital Vault" to
                      start your legacy setup.
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
