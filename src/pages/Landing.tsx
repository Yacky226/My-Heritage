import { useWallet } from '../hooks/useWallet';
import { useToast } from '../hooks/useToast';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useState } from 'react';
import {
  ShieldAlert,
  ArrowRight,
  Lock,
  Clock,
  UserCheck,
  Zap,
  Globe,
  Wallet
} from 'lucide-react';

interface LandingProps {
  onLaunchApp: () => void;
}

export function Landing({ onLaunchApp }: LandingProps) {
  const { wallet, connectWallet, isConnecting } = useWallet();
  const { addToast } = useToast();
  
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  const handleLaunchClick = () => {
    if (wallet.connected) {
      onLaunchApp();
    } else {
      setWalletModalOpen(true);
    }
  };

  const handleWalletSelect = async (provider: string) => {
    setWalletModalOpen(false);
    const success = await connectWallet(provider);
    if (success) {
      onLaunchApp();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none overflow-x-hidden relative">
      {/* Mesh glowing gradient blobs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Nav header */}
      <nav className="max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between z-10 select-none">
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            <ShieldAlert className="w-6.5 h-6.5 fill-white/10" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-white">
            Aegis Protocol
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleLaunchClick}
            className="text-sm font-bold text-slate-400 hover:text-white transition-colors cursor-pointer mr-2.5 hidden md:block"
          >
            Explore Dashboard
          </button>
          <Button
            size="sm"
            onClick={handleLaunchClick}
            className="text-xs py-2 px-4 shadow-[0_4px_12px_rgba(6,182,212,0.15)] shrink-0"
            icon={<Wallet className="w-4 h-4" />}
          >
            Launch App
          </Button>
        </div>
      </nav>

      {/* Hero Body */}
      <header className="max-w-4xl w-full mx-auto px-6 py-16 md:py-24 text-center z-10 flex flex-col items-center">
        <span className="text-[10px] font-extrabold tracking-widest text-blue-450 bg-blue-500/10 border border-blue-500/25 px-4 py-1.5 rounded-full uppercase mb-6.5 flex items-center gap-1.5 shadow-2xs select-none">
          <Zap className="w-3.5 h-3.5 animate-pulse" />
          Securing Digital Legacies On-Chain
        </span>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.12] mb-6 select-none bg-gradient-to-b from-white via-white to-slate-400 bg-clip-text text-transparent">
          Secure Your Digital Will <br />
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            on the Blockchain
          </span>
        </h1>
        <p className="text-sm md:text-lg text-slate-400 max-w-2xl leading-relaxed mb-10 select-none">
          A decentralized, trustless inheritance vault. Client-side encrypt your private credentials, designate beneficiaries, and execute smart contracts that release keys automatically upon owner inactivity.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full sm:w-auto">
          <Button
            size="lg"
            onClick={handleLaunchClick}
            className="w-full sm:w-auto shadow-xl shadow-blue-500/15"
            icon={<ArrowRight className="w-5 h-5 shrink-0" />}
          >
            Create Inheritance Vault
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => addToast('Opening Gitbook Docs...', 'info')}
            className="w-full sm:w-auto bg-slate-900 border-slate-800 text-slate-350 hover:bg-slate-850 hover:text-white"
            icon={<Globe className="w-5 h-5 shrink-0 text-slate-400" />}
          >
            Read Whitepaper
          </Button>
        </div>

        {/* Dashboard Mockup Display */}
        <div className="mt-16 md:mt-24 w-full relative group">
          <div className="absolute inset-0 bg-blue-500/10 rounded-3xl blur-3xl opacity-50 pointer-events-none group-hover:scale-105 transition-all duration-700" />
          <div className="relative border border-slate-800 bg-slate-900/40 backdrop-blur-md p-2 rounded-3xl overflow-hidden shadow-2xl">
            <img
              src="https://picsum.photos/seed/tech/1000/500"
              className="w-full rounded-2xl border border-slate-800/80 hover:scale-[1.01] transition-transform duration-500"
              alt="Aegis Inheritance Dashboard Preview"
            />
          </div>
        </div>
      </header>

      {/* Feature Section Grid */}
      <section className="bg-slate-950 border-t border-slate-900 py-20 px-6 z-10 w-full flex-grow">
        <div className="max-w-7xl w-full mx-auto flex flex-col items-center">
          <h2 className="text-2xl md:text-3.5xl font-extrabold text-white mb-3 text-center tracking-tight">
            Trustless Inheritance Technology
          </h2>
          <p className="text-sm text-slate-500 text-center mb-12 max-w-lg">
            Aegis merges local sandboxed cryptography with Ethereum smart contract logic to construct a secure bridge across generations.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6.5 w-full">
            {/* AES-256 */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6.5 flex flex-col text-left hover:border-slate-700/80 transition-colors select-none">
              <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-5 shrink-0 shadow-2xs">
                <Lock className="w-5.5 h-5.5" />
              </div>
              <h3 className="font-bold text-lg text-white mb-2 leading-none">
                Hybrid Encryption
              </h3>
              <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
                Your private secrets are encrypted locally with AES-256-GCM and wrapped to the heir ECDH public key before IPFS upload.
              </p>
            </div>

            {/* Smart Timers */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6.5 flex flex-col text-left hover:border-slate-700/80 transition-colors select-none">
              <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-5 shrink-0 shadow-2xs">
                <Clock className="w-5.5 h-5.5 animate-[spin_10s_linear_infinite]" />
              </div>
              <h3 className="font-bold text-lg text-white mb-2 leading-none">
                Proof of Life Timers
              </h3>
              <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
                Configure customizable inactivity windows from 30 to 365 days. The system pings your wallet status. When no signature is recorded within the window, the release is initialized.
              </p>
            </div>

            {/* Beneficiary */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6.5 flex flex-col text-left hover:border-slate-700/80 transition-colors select-none">
              <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-5 shrink-0 shadow-2xs">
                <UserCheck className="w-5.5 h-5.5 animate-pulse" />
              </div>
              <h3 className="font-bold text-lg text-white mb-2 leading-none">
                Beneficiary Claims Gate
              </h3>
              <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
                Designated heirs gain absolute visual dashboard tracking. Claim procedures enforce safety cooldowns to guarantee the owner has ample veto opportunity if an error occurs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Connect Wallet modal in Landing */}
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
    </div>
  );
}
