import { useEffect, useState } from 'react';
import { useChainId, usePublicClient } from 'wagmi';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useToast } from '../hooks/useToast';
import { useWallet } from '../hooks/useWallet';
import { generateHeirEncryptionKeyPair } from '../services/crypto';
import {
  getAegisVaultAddress,
  getAegisVaultAddressEnvName,
} from '../contracts/address';
import { sliceAddress } from '../utils/format';
import {
  ShieldCheck,
  Copy,
  Cpu,
  Monitor,
  CheckCircle,
  FileCode,
  AlertTriangle,
  Download,
  KeyRound,
  RefreshCw,
  Wallet,
  Server,
} from 'lucide-react';

interface SecurityProps {
  onNavigate: (pageId: string) => void;
}

export function Security({ onNavigate: _onNavigate }: SecurityProps) {
  const { addToast } = useToast();
  const { wallet } = useWallet();
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const aegisVaultAddress = getAegisVaultAddress(chainId);
  const aegisVaultAddressEnvName = getAegisVaultAddressEnvName(chainId);
  const [publicKeyJson, setPublicKeyJson] = useState('');
  const [privateKeyJson, setPrivateKeyJson] = useState('');
  const [isGeneratingKeys, setIsGeneratingKeys] = useState(false);
  const [contractCodeBytes, setContractCodeBytes] = useState<number | null>(null);
  const [latestBlock, setLatestBlock] = useState<bigint | null>(null);
  const [contractCheckError, setContractCheckError] = useState<string | null>(null);

  const contractStatus = !aegisVaultAddress
    ? 'Not Configured'
    : contractCodeBytes === null
      ? 'Checking'
      : contractCodeBytes > 0
        ? 'Deployed'
        : 'Missing';

  useEffect(() => {
    let mounted = true;

    const checkContract = async () => {
      if (!publicClient) return;

      try {
        setContractCheckError(null);

        if (!aegisVaultAddress) {
          const blockNumber = await publicClient.getBlockNumber();

          if (!mounted) return;

          setContractCodeBytes(0);
          setLatestBlock(blockNumber);
          setContractCheckError(`No AegisVault address configured for ${wallet.network}. Set ${aegisVaultAddressEnvName}.`);
          return;
        }

        const [bytecode, blockNumber] = await Promise.all([
          publicClient.getBytecode({ address: aegisVaultAddress }),
          publicClient.getBlockNumber(),
        ]);

        if (!mounted) return;

        setContractCodeBytes(bytecode ? Math.max((bytecode.length - 2) / 2, 0) : 0);
        setLatestBlock(blockNumber);
      } catch (error) {
        if (!mounted) return;
        console.error(error);
        setContractCodeBytes(0);
        setContractCheckError(error instanceof Error ? error.message : 'Unable to read contract bytecode');
      }
    };

    checkContract();

    return () => {
      mounted = false;
    };
  }, [aegisVaultAddress, aegisVaultAddressEnvName, publicClient, wallet.network]);

  const handleGenerateKeys = async () => {
    try {
      setIsGeneratingKeys(true);
      const keyPair = await generateHeirEncryptionKeyPair();

      setPublicKeyJson(JSON.stringify(keyPair.publicKey, null, 2));
      setPrivateKeyJson(JSON.stringify(keyPair.privateKey, null, 2));
      addToast('Heir encryption key pair generated locally', 'success', 2500);
    } catch (error) {
      console.error(error);
      addToast('Unable to generate encryption key pair', 'error', 3000);
    } finally {
      setIsGeneratingKeys(false);
    }
  };

  const handleCopy = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    addToast(message, 'success', 2000);
  };

  const handleDownloadPrivateKey = () => {
    if (!privateKeyJson) return;

    const blob = new Blob([privateKeyJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `aegis-heir-private-key-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-8 text-left select-none">
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
            Inspect the live protocol contract, current wallet session, and local-first encryption parameters.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 flex flex-col gap-6">
          <Card className="border-slate-100/70 p-6 flex flex-col justify-between h-full">
            <div>
              <CardHeader className="flex justify-between items-start border-none pb-0">
                <CardTitle icon={<KeyRound className="w-5 h-5 text-blue-500" />}>
                  Heir Encryption Key Pair
                </CardTitle>
                <span className="bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-450 border border-blue-100 dark:border-blue-900/35 text-[10px] tracking-widest uppercase font-mono px-2.5 py-0.5 rounded-full shrink-0 font-bold inline-flex items-center">Local Only</span>
              </CardHeader>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Generate an ECDH P-256 key pair in this browser. Share only the public key with the testator; keep the private key offline for future recovery.
              </p>

              <div className="mt-4 p-4 rounded-xl border border-rose-100/60 dark:border-rose-950 bg-rose-50/30 dark:bg-rose-950/10 flex gap-3 items-start">
                <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div className="text-xs text-rose-800 dark:text-rose-400 leading-relaxed">
                  <strong className="font-bold">Private key rule:</strong> never send the private key to anyone. If it is lost, the encrypted IPFS payload cannot be decrypted.
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-4">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleGenerateKeys}
                  loading={isGeneratingKeys}
                  className="w-full text-xs font-bold shadow-md shadow-blue-500/5"
                  icon={<RefreshCw className="w-4 h-4" />}
                >
                  Generate Local Key Pair
                </Button>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-350 mb-2">
                      Public Key to Share
                    </label>
                    <textarea
                      readOnly
                      value={publicKeyJson}
                      placeholder="Generate a key pair to export the heir public key."
                      className="w-full h-32 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-450 dark:placeholder-slate-550 text-xs font-mono p-3 resize-y focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(publicKeyJson, 'Public encryption key copied!')}
                      disabled={!publicKeyJson}
                      icon={<Copy className="w-3.5 h-3.5" />}
                      className="mt-2 text-xs font-bold text-slate-500 hover:text-slate-900"
                    >
                      Copy Public Key
                    </Button>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-350 mb-2">
                      Private Key to Store Offline
                    </label>
                    <textarea
                      readOnly
                      value={privateKeyJson}
                      placeholder="The private key appears here once generated. Download it and store it safely."
                      className="w-full h-32 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-450 dark:placeholder-slate-550 text-xs font-mono p-3 resize-y focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                    <div className="flex flex-col sm:flex-row gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(privateKeyJson, 'Private encryption key copied locally!')}
                        disabled={!privateKeyJson}
                        icon={<Copy className="w-3.5 h-3.5" />}
                        className="text-xs font-bold"
                      >
                        Copy Private Key
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={handleDownloadPrivateKey}
                        disabled={!privateKeyJson}
                        icon={<Download className="w-3.5 h-3.5" />}
                        className="text-xs font-bold"
                      >
                        Download Private Key
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-6">
          <Card className="border-slate-100/70 p-6 flex flex-col justify-between h-full">
            <div>
              <CardHeader className="flex items-center justify-between border-none pb-0">
                <CardTitle icon={<FileCode className="w-5 h-5 text-blue-500" />}>
                  Aegis Contract Status
                </CardTitle>
                <div className={`flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest font-mono ${
                  contractStatus === 'Deployed'
                    ? 'text-emerald-500 dark:text-emerald-400'
                    : contractStatus === 'Missing' || contractStatus === 'Not Configured'
                      ? 'text-rose-500 dark:text-rose-400'
                      : 'text-blue-500 dark:text-blue-400'
                }`}>
                  <CheckCircle className="w-3 h-3 animate-[pulse_1.5s_infinite]" />
                  {contractStatus}
                </div>
              </CardHeader>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                This card reads the configured AegisVault address from the active RPC and checks whether contract bytecode exists there.
              </p>

              <div className="mt-5 flex flex-col gap-3.5">
                <div className="p-3 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800/80 flex flex-col gap-2 text-xs">
                  <span className="text-2xs text-slate-400 uppercase tracking-wider block font-mono">Contract</span>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold text-slate-900 dark:text-white">AegisVault</span>
                    <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-350 font-mono">
                      {aegisVaultAddress ? sliceAddress(aegisVaultAddress) : 'Not configured'}
                    </code>
                  </div>
                </div>

                <div className="p-3 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-2xs text-slate-400 uppercase tracking-wider block font-mono">Network</span>
                    <strong className="text-slate-900 dark:text-white font-bold block mt-1">{wallet.network}</strong>
                  </div>
                  <div>
                    <span className="text-2xs text-slate-400 uppercase tracking-wider block font-mono">Latest Block</span>
                    <strong className="text-slate-900 dark:text-white font-bold block mt-1">
                      {latestBlock === null ? 'Pending' : latestBlock.toString()}
                    </strong>
                  </div>
                  <div>
                    <span className="text-2xs text-slate-400 uppercase tracking-wider block font-mono">Bytecode</span>
                    <strong className="text-slate-900 dark:text-white font-bold block mt-1">
                      {!aegisVaultAddress
                        ? 'Unavailable'
                        : contractCodeBytes === null
                          ? 'Checking'
                          : `${Math.round(contractCodeBytes / 1024)} KB`}
                    </strong>
                  </div>
                  <div>
                    <span className="text-2xs text-slate-400 uppercase tracking-wider block font-mono">Source</span>
                    <strong className="text-slate-900 dark:text-white font-bold block mt-1">Local ABI</strong>
                  </div>
                </div>

                {contractCheckError && (
                  <div className="p-3 rounded-xl border border-rose-100 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/15 text-xs text-rose-700 dark:text-rose-350 leading-relaxed">
                    {contractCheckError}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full items-stretch">
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
              <span className="text-2xs text-slate-400 uppercase tracking-wider block font-mono">Key Agreement</span>
              <strong className="text-slate-900 dark:text-white font-bold block mt-1">ECDH P-256 + HKDF</strong>
              <span className="text-3xs text-slate-450 font-mono mt-0.5 block">Per-vault ephemeral wrapping key</span>
            </div>
            <div className="p-3 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800/80">
              <span className="text-2xs text-slate-400 uppercase tracking-wider block font-mono">Symmetric Cipher</span>
              <strong className="text-slate-900 dark:text-white font-bold block mt-1">AES-GCM (256-Bit)</strong>
              <span className="text-3xs text-slate-450 font-mono mt-0.5 block">Authenticated Block GCM</span>
            </div>
            <div className="p-3 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800/80">
              <span className="text-2xs text-slate-400 uppercase tracking-wider block font-mono">Payload Distribution</span>
              <strong className="text-slate-900 dark:text-white font-bold block mt-1">IPFS / Pinata CID</strong>
              <span className="text-3xs text-slate-450 font-mono mt-0.5 block">Encrypted JSON payload</span>
            </div>
            <div className="p-3 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800/80">
              <span className="text-2xs text-slate-400 uppercase tracking-wider block font-mono">Timer Enforcement</span>
              <strong className="text-slate-900 dark:text-white font-bold block mt-1">Smart Contract Delay</strong>
              <span className="text-3xs text-slate-450 font-mono mt-0.5 block">Owner Challenge Period</span>
            </div>
          </div>
        </Card>

        <Card className="border-slate-100/70 p-6">
          <CardHeader className="border-none pb-0">
            <CardTitle icon={<Monitor className="w-5 h-5 text-blue-500" />}>
              Current Wallet Session
            </CardTitle>
          </CardHeader>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            Session details come from Wagmi and the currently connected injected wallet.
          </p>

          <div className="mt-5 flex flex-col gap-3 font-medium">
            <div className="p-3.5 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-slate-200/50 dark:bg-slate-850 flex items-center justify-center text-slate-600 dark:text-slate-400 shrink-0">
                  <Wallet className="w-4.5 h-4.5" />
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {wallet.connected ? wallet.provider ?? 'Injected Wallet' : 'Wallet Disconnected'}
                  </span>
                  <span className="text-3xs text-slate-450 font-mono truncate">
                    {wallet.address ? wallet.address : 'No account connected'}
                  </span>
                </div>
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 text-[9px] font-bold uppercase rounded-lg tracking-wider border font-mono shrink-0 ${
                wallet.connected
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 border-blue-100/60 dark:border-blue-900/40'
                  : 'text-slate-650 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700/60'
              }`}>
                {wallet.connected ? 'Connected' : 'Offline'}
              </span>
            </div>

            <div className="p-3.5 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-200/50 dark:bg-slate-850 flex items-center justify-center text-slate-600 dark:text-slate-400 shrink-0">
                  <Server className="w-4.5 h-4.5" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-slate-900 dark:text-white">RPC Network</span>
                  <span className="text-3xs text-slate-450 font-mono">{wallet.network}</span>
                </div>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-bold uppercase rounded-lg tracking-wider border font-mono text-slate-650 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700/60">
                Wagmi
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
