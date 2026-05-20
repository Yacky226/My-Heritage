import { useState } from 'react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../hooks/useToast';
import { useWallet } from '../hooks/useWallet';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Gauge,
  CheckCircle,
  HelpCircle,
  Mail,
  Smartphone,
  Globe
} from 'lucide-react';
import { sliceAddress } from '../utils/format';

interface SettingsProps {
  onNavigate: (pageId: string) => void;
}

type GasLevel = 'standard' | 'fast' | 'instant';

export function Settings({ onNavigate: _onNavigate }: SettingsProps) {
  const { addToast } = useToast();
  const { wallet } = useWallet();

  // Profile Form States
  const [profile, setProfile] = useState({
    name: 'Alex Web3',
    email: 'alex@aegis.io',
    address: wallet.address || '0x71C6793Bfc6F0b7b1348EF853a479B4Cd0C09A23',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256&h=256'
  });

  // Notification states
  const [notifs, setNotifs] = useState({
    emailWarnings: true,
    browserPings: true,
    onChainReminders: false,
    telegramPings: true
  });

  // Gas states
  const [gasLevel, setGasLevel] = useState<GasLevel>('fast');

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    addToast('Profile configuration saved successfully!', 'success', 2500);
  };

  const handleGasChange = (level: GasLevel) => {
    setGasLevel(level);
    const gwei = level === 'standard' ? '24 Gwei' : level === 'fast' ? '38 Gwei' : '65 Gwei';
    addToast(`Gas priority switched. Targeting: ${gwei}`, 'info', 2000);
  };

  const handleToggleNotif = (key: keyof typeof notifs) => {
    setNotifs((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
    addToast('Notification parameters updated', 'success', 1500);
  };

  return (
    <div className="flex flex-col gap-8 text-left select-none">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-6">
        <div>
          <div className="flex gap-2 text-xs text-slate-400 dark:text-slate-500 font-semibold mb-2 uppercase tracking-widest">
            <span>Home</span>
            <span>/</span>
            <span className="text-blue-500">Settings & Profiles</span>
          </div>
          <h1 className="text-2xl md:text-3.5xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <SettingsIcon className="w-7 h-7 text-blue-500" />
            Control Center
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-405 leading-relaxed mt-1">
            Configure profile credentials, active communication alert pathways, and Web3 gas priorities.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Side: Profile & Notifications */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Section: Profile info */}
          <Card className="border-slate-100/70 p-6">
            <CardHeader className="border-none pb-0">
              <CardTitle icon={<User className="w-5 h-5 text-blue-500" />}>
                Alex Profile Credentials
              </CardTitle>
            </CardHeader>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Verify name tags and email contact systems used by notification triggers.
            </p>

            <form onSubmit={handleProfileSave} className="mt-6 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-5 items-center pb-4 border-b border-slate-100 dark:border-slate-800/50">
                <img
                  src={profile.avatar}
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-slate-100 dark:ring-slate-850 shrink-0"
                  alt="Profile Avatar"
                />
                <div className="flex flex-col gap-1 text-center sm:text-left">
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">{profile.name}</span>
                  <span className="text-2xs text-slate-400 font-medium">Public address: <code className="bg-slate-50 dark:bg-slate-800/60 px-1.5 py-0.5 rounded font-mono font-bold text-slate-655">{sliceAddress(profile.address)}</code></span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Display Name"
                  placeholder="e.g. Alex Web3"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="py-2.5 text-xs rounded-xl"
                />
                <Input
                  label="Notification Email Address"
                  type="email"
                  placeholder="alex@aegis.io"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="py-2.5 text-xs rounded-xl"
                  icon={<Mail className="w-4 h-4 text-slate-400" />}
                />
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="text-xs font-bold shadow-md shadow-blue-500/10"
                >
                  Save Profile Changes
                </Button>
              </div>
            </form>
          </Card>

          {/* Section: Alerts Channels */}
          <Card className="border-slate-100/70 p-6">
            <CardHeader className="border-none pb-0">
              <CardTitle icon={<Bell className="w-5 h-5 text-blue-500" />}>
                Active Alarm Channels
              </CardTitle>
            </CardHeader>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Decentralized contracts broadcast telemetry pings. Select which client channels should prompt warnings prior to vault lockups.
            </p>

            <div className="mt-6 flex flex-col gap-3.5">
              
              <div className="p-3.5 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-medium">
                <div className="flex gap-3">
                  <Mail className="w-4.5 h-4.5 text-blue-500 shrink-0" />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-slate-900 dark:text-white">Email Notification Prompts</span>
                    <span className="text-3xs text-slate-450">Receives warning bulletins 10 days, 3 days, and 24 hours prior to expiration.</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifs.emailWarnings}
                  onChange={() => handleToggleNotif('emailWarnings')}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                />
              </div>

              <div className="p-3.5 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-medium">
                <div className="flex gap-3">
                  <Smartphone className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-slate-900 dark:text-white">Telegram Alerts Bot</span>
                    <span className="text-3xs text-slate-455">Subscribes webhooks to send ping updates directly to secure personal messengers.</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifs.telegramPings}
                  onChange={() => handleToggleNotif('telegramPings')}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                />
              </div>

              <div className="p-3.5 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-medium">
                <div className="flex gap-3">
                  <Globe className="w-4.5 h-4.5 text-purple-500 shrink-0" />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-slate-900 dark:text-white">Push Browser Alerts</span>
                    <span className="text-3xs text-slate-450">Triggers inline reminders when active tabs are opened inside client environments.</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifs.browserPings}
                  onChange={() => handleToggleNotif('browserPings')}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                />
              </div>

            </div>
          </Card>
        </div>

        {/* Right Side: Gas Priority Customizer */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <Card className="border-slate-100/70 p-6 flex flex-col justify-between h-full">
            <div>
              <CardHeader className="flex items-center justify-between border-none pb-0">
                <CardTitle icon={<Gauge className="w-5 h-5 text-blue-500" />}>
                  Gas Speed Limits
                </CardTitle>
                <span title="Web3 Gas Cost Options">
                  <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
                </span>
              </CardHeader>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Specify preferred gas constraints for transaction dispatch. Faster configurations avoid pending blocks during mainnet congestion.
              </p>

              <div className="mt-6 flex flex-col gap-3 font-medium">
                
                <div
                  onClick={() => handleGasChange('standard')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                    gasLevel === 'standard'
                      ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/20'
                      : 'border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-850/50'
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-slate-900 dark:text-white">Standard Priority</span>
                    <span className="text-3xs text-slate-450">Est. block time ~ 2 - 5 mins</span>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1 font-mono">
                    <span className="text-[10px] font-extrabold text-slate-600 dark:text-slate-300">24 Gwei</span>
                    <span className="text-[9px] text-slate-450">~ $2.10</span>
                  </div>
                </div>

                <div
                  onClick={() => handleGasChange('fast')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                    gasLevel === 'fast'
                      ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/20'
                      : 'border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-850/50'
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      Fast Priority
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/30">
                        Recommended
                      </span>
                    </span>
                    <span className="text-3xs text-slate-450">Est. block time ~ 15 - 30 secs</span>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1 font-mono">
                    <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">38 Gwei</span>
                    <span className="text-[9px] text-slate-450">~ $3.40</span>
                  </div>
                </div>

                <div
                  onClick={() => handleGasChange('instant')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                    gasLevel === 'instant'
                      ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/20'
                      : 'border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-850/50'
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-slate-900 dark:text-white">Instant Priority</span>
                    <span className="text-3xs text-slate-450">Est. block time ~ Under 12 secs</span>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1 font-mono">
                    <span className="text-[10px] font-extrabold text-purple-650 dark:text-purple-400">65 Gwei</span>
                    <span className="text-[9px] text-slate-450">~ $5.80</span>
                  </div>
                </div>

              </div>
            </div>
            
            <div className="p-3 bg-blue-50/30 dark:bg-slate-900/60 rounded-2xl border border-blue-100/50 dark:border-slate-850 text-3xs text-slate-450 leading-relaxed font-mono flex items-center gap-2 mt-4">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              On-chain gas feeds refreshed automatically.
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
