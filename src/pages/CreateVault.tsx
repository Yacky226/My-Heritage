import { useState, useEffect } from 'react';
import { useVaults } from '../hooks/useVaults';
import { useToast } from '../hooks/useToast';
import { useWallet } from '../hooks/useWallet';
import { WizardStepper } from '../components/vault/WizardStepper';
import { UploadZone } from '../components/vault/UploadZone';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { Tooltip } from '../components/ui/Tooltip';
import { simulateEncryption } from '../utils/crypto';
import type { CryptographicResult } from '../utils/crypto';
import { sliceAddress } from '../utils/format';
import {
  User,
  ShieldCheck,
  Lock,
  Clock,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Fuel,
  FileCheck
} from 'lucide-react';

interface CreateVaultProps {
  onNavigate: (pageId: string) => void;
}

export function CreateVault({ onNavigate }: CreateVaultProps) {
  const { createVault } = useVaults();
  const { addToast } = useToast();
  const { wallet } = useWallet();

  const [currentStep, setCurrentStep] = useState(1);
  
  // Step 1: Heir Info
  const [vaultName, setVaultName] = useState('');
  const [heirAddress, setHeirAddress] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Step 2: Upload Zone
  const [files, setFiles] = useState<Array<{ name: string; size: string; type: string }>>([]);

  // Step 3: Encryption
  const [encryptionProgress, setEncryptionProgress] = useState(0);
  const [encryptionText, setEncryptionText] = useState('Preparing encryption cipher block...');
  const [cryptResults, setCryptResults] = useState<CryptographicResult | null>(null);

  // Step 4: Timer Config
  const [inactivityDays, setInactivityDays] = useState(90);
  const [emailAlert, setEmailAlert] = useState(true);
  const [browserAlert, setBrowserAlert] = useState(true);

  // Step 5: Finalize
  const [isInitializing, setIsInitializing] = useState(false);

  const wizardSteps = [
    { number: 1, label: 'Heir Details' },
    { number: 2, label: 'Upload Data' },
    { number: 3, label: 'Local Encrypt' },
    { number: 4, label: 'Timer Config' },
    { number: 5, label: 'Review & Deploy' },
  ];

  // Perform Step 3 encryption simulation automatically upon entering step 3
  useEffect(() => {
    if (currentStep === 3) {
      setEncryptionProgress(0);
      setEncryptionText('Initializing AES-256-GCM cipher engine...');
      
      const runSim = async () => {
        const payloadName = files.length > 0 ? files[0].name : 'legacy_payload.zip';
        const payloadSize = files.reduce((acc, curr) => {
          const val = parseFloat(curr.size);
          const isMB = curr.size.includes('MB');
          return acc + Math.floor(val * (isMB ? 1024 * 1024 : 1024));
        }, 1024 * 1024);

        try {
          const result = await simulateEncryption(payloadName, payloadSize, (pct, txt) => {
            setEncryptionProgress(pct);
            setEncryptionText(txt);
          });
          setCryptResults(result);
        } catch (e) {
          addToast('Encryption pipeline failure', 'error');
        }
      };

      runSim();
    }
  }, [currentStep, files, addToast]);

  const handleNext = () => {
    const nextErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!vaultName.trim()) {
        nextErrors.vaultName = 'Vault Name is required';
      }
      if (!heirAddress.trim()) {
        nextErrors.heirAddress = 'Heir Address is required';
      } else if (!heirAddress.startsWith('0x') || heirAddress.length !== 42) {
        nextErrors.heirAddress = 'Invalid address. Must be a 42-character Ethereum address (0x...)';
      }

      if (Object.keys(nextErrors).length > 0) {
        setErrors(nextErrors);
        return;
      }
      setErrors({});
    }

    if (currentStep === 2) {
      if (files.length === 0) {
        addToast('Please upload at least one secure file', 'error');
        return;
      }
    }

    if (currentStep === 3) {
      if (encryptionProgress < 100) {
        addToast('Please wait for client-side encryption pipeline to complete', 'info');
        return;
      }
    }

    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleDeployVault = async () => {
    if (!wallet.connected) {
      addToast('Please connect your Web3 wallet first', 'error');
      return;
    }

    setIsInitializing(true);
    const success = await createVault(
      vaultName,
      heirAddress,
      inactivityDays,
      description,
      files
    );

    if (success) {
      setIsInitializing(false);
      onNavigate('dashboard');
    } else {
      setIsInitializing(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 text-left select-none max-w-4xl w-full mx-auto">
      {/* Page Header */}
      <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800/80 pb-6">
        <div>
          <div className="flex gap-2 text-xs text-slate-400 dark:text-slate-500 font-semibold mb-2 uppercase tracking-widest">
            <span className="cursor-pointer hover:text-blue-500" onClick={() => onNavigate('vaults')}>My Vaults</span>
            <span>/</span>
            <span className="text-blue-500">Create New Vault</span>
          </div>
          <h1 className="text-2xl md:text-3.5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Create Digital Legacy Vault
          </h1>
        </div>
      </div>

      {/* Stepper Header */}
      <WizardStepper steps={wizardSteps} currentStep={currentStep} />

      {/* Steps Content Panel */}
      <div className="w-full">
        {/* Step 1: Heir Info */}
        {currentStep === 1 && (
          <Card className="border-slate-100/70 p-6 md:p-8 flex flex-col gap-6.5">
            <CardHeader className="p-0 border-none m-0 text-left">
              <CardTitle icon={<User className="w-5.5 h-5.5 text-blue-500 shrink-0" />}>
                Step 1: Beneficiary Details
              </CardTitle>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-405 leading-relaxed mt-1">
                Enter your beneficiary wallet details. They will be registered on-chain as the sole entity authorized to request decryption keys if you are inactive.
              </p>
            </CardHeader>

            <div className="flex flex-col gap-4.5">
              <Input
                label="Vault Configuration Name"
                placeholder="e.g. MetaMask seed sheet, Cold Wallet Keys"
                value={vaultName}
                onChange={(e) => setVaultName(e.target.value)}
                error={errors.vaultName}
                helperText="A descriptive identifier to track this vault (public on blockchain)."
              />

              <Input
                label="Heir Ethereum Wallet Address (0x...)"
                placeholder="0x..."
                value={heirAddress}
                onChange={(e) => setHeirAddress(e.target.value)}
                error={errors.heirAddress}
                helperText="Sole wallet address permitted to initialize claim sequences."
              />

              <div className="text-left w-full">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-350 mb-2">
                  Legacy Description Context (Optional)
                </label>
                <textarea
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-100 placeholder-slate-450 dark:placeholder-slate-550 text-sm p-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none h-28 resize-none"
                  placeholder="Provide any helpful instructions or descriptions regarding the encrypted payload contents. Encrypted locally and visible to heir upon unseal."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          </Card>
        )}

        {/* Step 2: Upload Zone */}
        {currentStep === 2 && (
          <Card className="border-slate-100/70 p-6 md:p-8 flex flex-col gap-6.5">
            <CardHeader className="p-0 border-none m-0 text-left">
              <CardTitle icon={<Lock className="w-5.5 h-5.5 text-blue-500 shrink-0" />}>
                Step 2: Upload Sensitive Assets
              </CardTitle>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-405 leading-relaxed mt-1">
                Queue files to secure in the digital inheritance vault. All files are encrypted client-side in the browser before broadcast.
              </p>
            </CardHeader>

            <UploadZone onFilesSelected={setFiles} selectedFiles={files} />
          </Card>
        )}

        {/* Step 3: Encryption progress */}
        {currentStep === 3 && (
          <Card className="border-slate-100/70 p-6 md:p-8 flex flex-col gap-6.5">
            <CardHeader className="p-0 border-none m-0 text-left">
              <CardTitle icon={<ShieldCheck className="w-5.5 h-5.5 text-blue-500 shrink-0" />}>
                Step 3: Client-Side AES-256 Encryption
              </CardTitle>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-405 leading-relaxed mt-1">
                Deriving secure keys using local browser PBKDF2 functions and broadcasting encrypted fragments.
              </p>
            </CardHeader>

            <div className="flex flex-col gap-6">
              {/* Progress bars */}
              <div className="flex flex-col gap-2">
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-350 ease-out"
                    style={{ width: `${encryptionProgress}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <span>{encryptionText}</span>
                  <span>{encryptionProgress}%</span>
                </div>
              </div>

              {/* logs checklist details */}
              <div className="bg-slate-50 dark:bg-slate-950/40 p-4 border border-slate-100 dark:border-slate-850 rounded-2xl flex flex-col gap-2.5 text-xs font-mono text-slate-600 dark:text-slate-350">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${encryptionProgress >= 10 ? 'bg-emerald-500' : 'bg-slate-300 animate-ping'}`} />
                  <span>[CIPHER] Configured AES-256-GCM block chaining.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${encryptionProgress >= 25 ? 'bg-emerald-500' : encryptionProgress >= 10 ? 'bg-slate-300 animate-ping' : 'bg-slate-200'}`} />
                  <span>[KDF] PBKDF2 stretching complete. Derived browser symmetric key.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${encryptionProgress >= 45 ? 'bg-emerald-500' : encryptionProgress >= 25 ? 'bg-slate-300 animate-ping' : 'bg-slate-200'}`} />
                  <span>[BLOC] Payload data blocks encrypted with derived symmetric key.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${encryptionProgress >= 65 ? 'bg-emerald-500' : encryptionProgress >= 45 ? 'bg-slate-300 animate-ping' : 'bg-slate-200'}`} />
                  <span>[HASH] Generated SHA-256 integrity hash: {cryptResults?.fileHash ? cryptResults.fileHash.slice(0, 18) + '...' : 'pending'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${encryptionProgress >= 80 ? 'bg-emerald-500' : encryptionProgress >= 65 ? 'bg-slate-300 animate-ping' : 'bg-slate-200'}`} />
                  <span>[SHAR] Fragmented payload into 3 independent encrypted files.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${encryptionProgress >= 100 ? 'bg-emerald-500' : encryptionProgress >= 80 ? 'bg-slate-300 animate-ping' : 'bg-slate-200'}`} />
                  <span>[IPFS] Broadcasted shards to Paris, Tokyo, and New York network storage nodes.</span>
                </div>
              </div>

              {encryptionProgress === 100 && (
                <Alert type="success" title="Local Cryptography Succeeded">
                  Files are securely stored in a client-side fragmented state. The decryption keys are compiled and ready for smart contract binding.
                </Alert>
              )}
            </div>
          </Card>
        )}

        {/* Step 4: Timer Config */}
        {currentStep === 4 && (
          <Card className="border-slate-100/70 p-6 md:p-8 flex flex-col gap-6.5">
            <CardHeader className="p-0 border-none m-0 text-left">
              <CardTitle icon={<Clock className="w-5.5 h-5.5 text-blue-500 shrink-0" />}>
                Step 4: Safety Timer Settings
              </CardTitle>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-405 leading-relaxed mt-1">
                Configure the inactivity safety timer duration. If your wallet registers zero transactions or signatures inside this window, beneficiary claim gates are unlocked.
              </p>
            </CardHeader>

            <div className="flex flex-col gap-7.5">
              {/* Slider details */}
              <div className="text-left w-full">
                <div className="flex justify-between items-baseline mb-3">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-350">
                    Inactivity Safety Period
                  </span>
                  <span className="text-lg font-extrabold text-blue-600 dark:text-blue-400">
                    {inactivityDays} Days
                  </span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="365"
                  step="15"
                  value={inactivityDays}
                  onChange={(e) => setInactivityDays(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-3xs text-slate-400 font-bold uppercase tracking-wider mt-2.5 font-mono">
                  <span>30 Days (Min)</span>
                  <span>90 Days</span>
                  <span>180 Days</span>
                  <span>365 Days (Max)</span>
                </div>
              </div>

              {/* Alert channels check */}
              <div className="text-left flex flex-col gap-4">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-1">
                  Heartbeat Notification Channels
                </span>
                
                <label className="flex items-center gap-3 p-3.5 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors w-full">
                  <input
                    type="checkbox"
                    checked={emailAlert}
                    onChange={(e) => setEmailAlert(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-650 border-slate-300 focus:ring-blue-500/20 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Email Heartbeat Alert Toggles
                    </span>
                    <span className="text-[10px] text-slate-450 dark:text-slate-500 block mt-0.5">Receive alert cues when inactivity timer sits under 5 days left.</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3.5 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors w-full">
                  <input
                    type="checkbox"
                    checked={browserAlert}
                    onChange={(e) => setBrowserAlert(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-650 border-slate-300 focus:ring-blue-500/20 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Browser In-App Banner Alerts
                    </span>
                    <span className="text-[10px] text-slate-450 dark:text-slate-500 block mt-0.5">Prompt heartbeat signature modals upon dashboard dashboard loads.</span>
                  </div>
                </label>
              </div>
            </div>
          </Card>
        )}

        {/* Step 5: Review & Deploy */}
        {currentStep === 5 && (
          <Card className="border-slate-100/70 p-6 md:p-8 flex flex-col gap-6.5">
            <CardHeader className="p-0 border-none m-0 text-left">
              <CardTitle icon={<FileCheck className="w-5.5 h-5.5 text-blue-500 shrink-0" />}>
                Step 5: Review & Initialize
              </CardTitle>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-405 leading-relaxed mt-1">
                Confirm all parameters before signing the deploy transaction. The contract setup is written on-chain to the Ethereum registry.
              </p>
            </CardHeader>

            <div className="flex flex-col gap-6 text-left">
              {/* Summary details */}
              <div className="bg-slate-50 dark:bg-slate-950/45 border border-slate-100 dark:border-slate-850 p-4.5 rounded-2xl flex flex-col gap-3.5 text-xs">
                <div className="flex justify-between items-center pb-2.5 border-b border-slate-150 dark:border-slate-800/80">
                  <span className="font-semibold text-slate-450 uppercase tracking-widest text-3xs">Property</span>
                  <span className="font-semibold text-slate-450 uppercase tracking-widest text-3xs">Configuration Spec</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Vault Configuration Name</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{vaultName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Designated Beneficiary Address</span>
                  <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{sliceAddress(heirAddress)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Safety Window Threshold</span>
                  <span className="font-bold text-blue-500">{inactivityDays} Days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Secure Payload Manifest</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {files.length} file{files.length > 1 ? 's' : ''} ({
                      files.reduce((acc, curr) => {
                        const val = parseFloat(curr.size);
                        const isMB = curr.size.includes('MB');
                        return acc + (val * (isMB ? 1024 * 1024 : 1024));
                      }, 0) > 1024 * 1024
                        ? (files.reduce((acc, curr) => acc + parseFloat(curr.size), 0)).toFixed(1) + ' MB'
                        : (files.reduce((acc, curr) => acc + parseFloat(curr.size), 0)).toFixed(1) + ' KB'
                    })
                  </span>
                </div>
              </div>

              {/* Gas limit estimations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 rounded-xl">
                  <span className="text-4xs text-slate-450 uppercase tracking-widest font-bold block mb-1">
                    Smart Contract Factory
                  </span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-350 block mt-0.5">
                    AegisVaultRegistry.sol
                  </span>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 rounded-xl">
                  <span className="text-4xs text-slate-450 uppercase tracking-widest font-bold block mb-1 flex items-center gap-1.5">
                    Estimated Gas Fee
                    <Tooltip content="Ethereum contract factory deploy base gas fee." iconOnly />
                  </span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-350 block mt-0.5 flex items-center gap-1.5">
                    <Fuel className="w-4 h-4 text-blue-500" />
                    0.0042 ETH (~$12.50)
                  </span>
                </div>
              </div>

              {/* Wallet warning */}
              {!wallet.connected && (
                <Alert type="danger">
                  Please connect your decentralized wallet at the top of the header bar to authorize on-chain deployment.
                </Alert>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Navigation Buttons footer */}
      <div className="flex justify-between items-center w-full mt-2">
        {currentStep > 1 ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleBack}
            className="text-xs px-5 py-2.5 hover:-translate-y-[1px]"
            icon={<ArrowLeft className="w-4 h-4 shrink-0" />}
          >
            Back
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onNavigate('vaults')}
            className="text-xs px-5 py-2.5 hover:-translate-y-[1px]"
          >
            Cancel
          </Button>
        )}

        {currentStep < 5 ? (
          <Button
            variant="primary"
            size="sm"
            onClick={handleNext}
            className="text-xs px-5 py-2.5 shadow-md shadow-blue-500/5 hover:-translate-y-[1px]"
            icon={<ArrowRight className="w-4 h-4 shrink-0" />}
          >
            Next Step
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={handleDeployVault}
            loading={isInitializing}
            disabled={!wallet.connected}
            className="text-xs px-6 py-2.5 shadow-md shadow-blue-500/10 hover:-translate-y-[1px]"
            icon={<CheckCircle className="w-4.5 h-4.5 shrink-0" />}
          >
            Securely Deploy on Blockchain
          </Button>
        )}
      </div>
    </div>
  );
}
