import { useState } from 'react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../hooks/useToast';
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Copy,
  Cpu,
  Monitor,
  CheckCircle,
  FileText,
  FileCode,
  AlertTriangle,
  Lock
} from 'lucide-react';

interface SecurityProps {
  onNavigate: (pageId: string) => void;
}

export function Security({ onNavigate: _onNavigate }: SecurityProps) {
  const { addToast } = useToast();
  const [revealSeed, setRevealSeed] = useState(false);
  const [passphraseConfirm, setPassphraseConfirm] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const mockSeedPhrase = "desert utility pulse visual strategy manual grid mesh pattern audit trigger proof";

  const smartContracts = [
    { name: 'AegisRegistryFactory', address: '0x8f2d...b14c', status: 'Audited', auditor: 'CertiK', auditDate: '2026-03-12' },
    { name: 'AegisHeartbeatMonitor', address: '0x1c3a...9e5d', status: 'Audited', auditor: 'Hacken', auditDate: '2026-04-01' },
    { name: 'AegisEncryptedStore', address: '0x5d9e...3a8f', status: 'Audited', auditor: 'CertiK', auditDate: '2026-03-15' }
  ];

  const deviceSessions = [
    { device: 'Brave Browser (Windows 11)', ip: '192.168.1.143', location: 'Paris, France', status: 'Current Session' },
    { device: 'MetaMask Mobile App (iOS)', ip: '10.0.8.23', location: 'Paris, France', status: 'Authorized' }
  ];

  const handleRevealClick = () => {
    if (!confirmed) {
      if (passphraseConfirm.toLowerCase() !== 'reveal') {
        setErrorMsg('Please type "REVEAL" to confirm you understand the security implications.');
        return;
      }
      setErrorMsg('');
      setConfirmed(true);
    }
    setRevealSeed(!revealSeed);
  };

  const handleCopy = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    addToast(message, 'success', 2000);
  };

  return (
    <div className="flex flex-col gap-8 text-left select-none">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-6">
        <div>
          <div className="flex gap-2 text-xs text-slate-400 dark:text-slate-500 font-semibold mb-2 uppercase tracking-widest">
            <span>Home</span>
            <span>/</span>
            <span className="text-blue-500">Security Parameters</span>
          </div>
          <h1 className="text-2xl md:text-3.5xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-blue-500 animate-[pulse_2s_infinite]" />
            Security & Contracts
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-405 leading-relaxed mt-1">
            Examine decentralized smart contract specifications, security audit validations, and local-first cryptographic parameters.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Side: Master Key Management */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          <Card className="border-slate-100/70 p-6 flex flex-col justify-between h-full">
            <div>
              <CardHeader className="flex justify-between items-start border-none pb-0">
                <CardTitle icon={<Lock className="w-5 h-5 text-blue-500" />}>
                  Master Recovery Key Seed
                </CardTitle>
                <span className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 border border-rose-100 dark:border-rose-900/35 text-[10px] tracking-widest uppercase font-mono px-2.5 py-0.5 rounded-full shrink-0 font-bold inline-flex items-center">High Risk</span>
              </CardHeader>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                This seed is generated locally to derive your client-side encryption and fragment recombination keys. 
                <strong> Aegis Protocol never stores this on any centralized server.</strong> If lost, your digital legacy cannot be recovered.
              </p>

              {/* Warning box */}
              <div className="mt-4 p-4 rounded-xl border border-rose-100/60 dark:border-rose-950 bg-rose-50/30 dark:bg-rose-950/10 flex gap-3 items-start">
                <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div className="text-xs text-rose-800 dark:text-rose-400 leading-relaxed">
                  <strong className="font-bold">Crucial Precaution:</strong> Never share this recovery seed with anyone. 
                  Malicious parties with access to this seed can claim and decrypt your legacy vaults instantly.
                </div>
              </div>

              {/* Passphrase Reveal Panel */}
              <div className="mt-6 p-4.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                {revealSeed ? (
                  <div className="flex flex-col gap-4">
                    <div className="p-4 bg-white dark:bg-slate-950 border border-blue-100 dark:border-blue-900/40 rounded-xl font-mono text-center text-slate-800 dark:text-slate-200 select-text break-words leading-loose font-bold tracking-wide shadow-inner text-xs sm:text-sm">
                      {mockSeedPhrase}
                    </div>
                    <div className="flex gap-3 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(mockSeedPhrase, 'Master recovery seed copied!')}
                        icon={<Copy className="w-3.5 h-3.5" />}
                        className="text-xs font-bold text-slate-500 hover:text-slate-900"
                      >
                        Copy Phrase
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRevealSeed(false)}
                        icon={<EyeOff className="w-3.5 h-3.5" />}
                        className="text-xs font-bold"
                      >
                        Hide Key Seed
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {!confirmed && (
                      <Input
                        label="Security Validation"
                        placeholder="Type 'REVEAL' to unlock export options"
                        value={passphraseConfirm}
                        onChange={(e) => setPassphraseConfirm(e.target.value)}
                        error={errorMsg}
                        className="text-xs py-2"
                        helperText="Type the confirmation word precisely to enable the reveal switch."
                      />
                    )}
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={handleRevealClick}
                      className="w-full text-xs font-bold shadow-md shadow-rose-500/5 mt-1.5"
                      icon={<Eye className="w-4 h-4" />}
                    >
                      Unlock & Reveal Recovery Seed
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Side: Security Audited Contracts */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <Card className="border-slate-100/70 p-6 flex flex-col justify-between h-full">
            <div>
              <CardHeader className="flex items-center justify-between border-none pb-0">
                <CardTitle icon={<FileCode className="w-5 h-5 text-blue-500" />}>
                  Verified Smart Contracts
                </CardTitle>
                <div className="flex items-center gap-1 text-[10px] text-emerald-500 dark:text-emerald-400 font-extrabold uppercase tracking-widest font-mono">
                  <CheckCircle className="w-3 h-3 text-emerald-500 animate-[pulse_1.5s_infinite]" />
                  Verified
                </div>
              </CardHeader>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Smart contracts deployed on Ethereum Mainnet are open-source and audited by premium cryptography firms to guarantee asset preservation and mathematical immutability.
              </p>

              <div className="mt-5 flex flex-col gap-3.5">
                {smartContracts.map((contract, index) => (
                  <div key={index} className="p-3 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        {contract.name}
                      </span>
                      <span className="text-3xs font-mono text-slate-450 uppercase tracking-widest mt-1 block">
                        Address: <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-slate-700 dark:text-slate-350">{contract.address}</code>
                      </span>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1 font-mono">
                      <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-100/50 dark:border-emerald-900/40">
                        {contract.status}
                      </span>
                      <span className="text-[9px] text-slate-400">By {contract.auditor}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

      </div>

      {/* Cryptographic Standards & Session Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full items-stretch">
        
        {/* Section: Crypto Standards */}
        <Card className="border-slate-100/70 p-6">
          <CardHeader className="border-none pb-0">
            <CardTitle icon={<Cpu className="w-5 h-5 text-blue-500" />}>
              Cryptographic Suite Overview
            </CardTitle>
          </CardHeader>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            Local-first encryption operations leverage standardized, hardened cryptographic algorithms inside your browser runtime sandbox.
          </p>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs font-medium">
            <div className="p-3 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800/80">
              <span className="text-2xs text-slate-400 uppercase tracking-wider block font-mono">Key Derivation</span>
              <strong className="text-slate-900 dark:text-white font-bold block mt-1">PBKDF2 (SHA-256)</strong>
              <span className="text-3xs text-slate-450 font-mono mt-0.5 block">100,000 Stretching Loops</span>
            </div>
            <div className="p-3 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800/80">
              <span className="text-2xs text-slate-400 uppercase tracking-wider block font-mono">Symmetric Cipher</span>
              <strong className="text-slate-900 dark:text-white font-bold block mt-1">AES-GCM (256-Bit)</strong>
              <span className="text-3xs text-slate-450 font-mono mt-0.5 block">Authenticated Block GCM</span>
            </div>
            <div className="p-3 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800/80">
              <span className="text-2xs text-slate-400 uppercase tracking-wider block font-mono">Payload Distribution</span>
              <strong className="text-slate-900 dark:text-white font-bold block mt-1">IPFS Sharding Network</strong>
              <span className="text-3xs text-slate-450 font-mono mt-0.5 block">Encrypted Package Fragments</span>
            </div>
            <div className="p-3 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800/80">
              <span className="text-2xs text-slate-400 uppercase tracking-wider block font-mono">Timer Enforcement</span>
              <strong className="text-slate-900 dark:text-white font-bold block mt-1">Smart Contract Delay</strong>
              <span className="text-3xs text-slate-450 font-mono mt-0.5 block">Owner Challenge Period</span>
            </div>
          </div>
        </Card>

        {/* Section: Session Activity */}
        <Card className="border-slate-100/70 p-6">
          <CardHeader className="border-none pb-0">
            <CardTitle icon={<Monitor className="w-5 h-5 text-blue-500" />}>
              Active Device Sessions
            </CardTitle>
          </CardHeader>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            These devices have signed messages and are authorized to access local indices.
          </p>

          <div className="mt-5 flex flex-col gap-3 font-medium">
            {deviceSessions.map((session, index) => (
              <div key={index} className="p-3.5 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-200/50 dark:bg-slate-850 flex items-center justify-center text-slate-600 dark:text-slate-400 shrink-0">
                    <Monitor className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-slate-900 dark:text-white">{session.device}</span>
                    <span className="text-3xs text-slate-450 font-mono">IP: {session.ip} • Location: {session.location}</span>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 text-[9px] font-bold uppercase rounded-lg tracking-wider border font-mono ${
                  session.status === 'Current Session'
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 border-blue-100/60 dark:border-blue-900/40'
                    : 'text-slate-650 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700/60'
                }`}>
                  {session.status}
                </span>
              </div>
            ))}
          </div>
        </Card>

      </div>
    </div>
  );
}
