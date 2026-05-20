import { useState, useEffect } from 'react';
import { useClaims } from '../../hooks/useClaims';
import type { SimulatedClaim } from '../../hooks/useClaims';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Alert } from '../ui/Alert';
import { sliceAddress } from '../../utils/format';
import { Vault as VaultIcon, ShieldAlert, Key, Clock, ShieldCheck, Download, CheckCircle, FileText } from 'lucide-react';

interface HeirVaultCardProps {
  claim: SimulatedClaim;
}

export function HeirVaultCard({ claim }: HeirVaultCardProps) {
  const { initiateClaim, decryptClaimFiles } = useClaims();
  const [passphrase, setPassphrase] = useState('');
  const [decryptionProgress, setDecryptionProgress] = useState(0);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [isDecrypted, setIsDecrypted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [cooldownPercent, setCooldownPercent] = useState(100);

  // Track progress bar percentage during smart contract cooldown unseal
  useEffect(() => {
    if (claim.status === 'Cooldown' && claim.cooldownRemaining > 0) {
      const pct = (claim.cooldownRemaining / 15) * 100;
      setCooldownPercent(pct);
    }
  }, [claim.status, claim.cooldownRemaining]);

  const handleInitiate = async () => {
    await initiateClaim(claim.vaultId);
  };

  const handleDecrypt = async () => {
    if (!passphrase.trim()) {
      setErrorMsg('Please enter your recovery passphrase seed');
      return;
    }
    setErrorMsg('');
    setIsDecrypting(true);

    // Simulate key derivation and file assembly progress
    const interval = setInterval(() => {
      setDecryptionProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 25;
      });
    }, 800);

    const success = await decryptClaimFiles(claim.vaultId, passphrase);
    if (success) {
      setIsDecrypting(false);
      setIsDecrypted(true);
    } else {
      setIsDecrypting(false);
      setDecryptionProgress(0);
    }
  };

  const handleDownload = () => {
    // Generate a mock zip package download
    const blob = new Blob(['Aegis Encrypted Shards Recombined Successfully.'], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${claim.vaultName.toLowerCase().replace(/\s+/g, '_')}_decrypted.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card hoverable className="flex flex-col border-slate-100/70 text-left select-none h-full justify-between">
      <div className="flex flex-col gap-4">
        {/* Header elements */}
        <div className="flex justify-between items-start gap-4">
          <Badge status={claim.status} />
          <span className="text-[10px] text-slate-400 font-mono tracking-tight">
            Owner: {sliceAddress(claim.owner)}
          </span>
        </div>

        {/* Core title details */}
        <div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <VaultIcon className="w-5 h-5 text-blue-500 shrink-0" />
            {claim.vaultName}
          </h4>
          <span className="text-2xs text-slate-400 mt-1 block">
            Contains {claim.fileCount} encrypted file{claim.fileCount > 1 ? 's' : ''} ({claim.fileSize})
          </span>
          {claim.description && (
            <p className="text-xs text-slate-500 dark:text-slate-450 mt-2.5 leading-relaxed">
              {claim.description}
            </p>
          )}
        </div>

        {/* Phase Action Renderings */}
        {claim.status === 'Active' && (
          <Alert type="success" className="py-2.5 px-3">
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 animate-[pulse_2s_infinite]" />
              <span>Owner is active. Safety countdown timer is extended.</span>
            </div>
          </Alert>
        )}

        {claim.status === 'Locked' && (
          <div className="flex flex-col gap-3">
            <Alert type="danger" className="py-2.5 px-3">
              <div className="flex items-center gap-2 text-xs">
                <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 animate-bounce" />
                <span>Owner marked inactive. Smart contract unlock available.</span>
              </div>
            </Alert>
            <Button
              variant="primary"
              size="sm"
              onClick={handleInitiate}
              className="w-full text-xs shadow-md shadow-blue-500/10"
              icon={<ShieldCheck className="w-4 h-4" />}
            >
              Initiate Claim Request
            </Button>
          </div>
        )}

        {claim.status === 'Cooldown' && (
          <div className="flex flex-col gap-3">
            <Alert type="warning" className="py-2.5 px-3">
              <div className="flex items-center gap-2 text-xs text-amber-800 dark:text-amber-350">
                <Clock className="w-4 h-4 text-amber-500 shrink-0 animate-spin" />
                <span>Smart contract cooldown active. Owner alert broadcasted.</span>
              </div>
            </Alert>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${cooldownPercent}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold uppercase tracking-wider font-mono">
              <span>Safety Cooldown</span>
              <span>{claim.cooldownRemaining}s remaining</span>
            </div>
          </div>
        )}

        {claim.status === 'Claimed' && (
          <div className="flex flex-col gap-3 pt-1">
            {!isDecrypted ? (
              <>
                <Input
                  label="Master Passphrase Seed"
                  type="password"
                  placeholder="Enter 12-word seed phrase or private recovery key"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  error={errorMsg}
                  disabled={isDecrypting}
                  className="py-2 text-xs"
                  helperText="Required to decrypt shards locally before unpacking."
                  icon={<Key className="w-4 h-4" />}
                />
                
                {isDecrypting ? (
                  <div className="flex flex-col gap-2">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${decryptionProgress}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider text-right">
                      {decryptionProgress < 100 ? 'Decrypting Local Shards...' : 'Payload Decompressed'}
                    </span>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDecrypt}
                    className="w-full text-xs"
                    icon={<Key className="w-4 h-4" />}
                  >
                    Authorize Shard Decryption
                  </Button>
                )}
              </>
            ) : (
              <div className="flex flex-col gap-3">
                <Alert type="success" className="py-2.5 px-3">
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Vault Decrypted Successfully!</span>
                  </div>
                </Alert>
                
                {/* Decrypted files list */}
                <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden mb-1.5">
                  <div className="bg-slate-50 dark:bg-slate-950/60 p-2 border-b border-slate-100 dark:border-slate-850 text-2xs font-semibold text-slate-450 uppercase tracking-widest">
                    Available Packages
                  </div>
                  <div className="p-2.5 flex flex-col gap-1.5 bg-white dark:bg-slate-900">
                    {claim.files?.map((f, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          {f.name}
                        </span>
                        <span className="text-3xs text-slate-400 font-mono">{f.size}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleDownload}
                  className="w-full text-xs shadow-md shadow-emerald-500/10"
                  icon={<Download className="w-4 h-4" />}
                >
                  Download Decrypted Bundle
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
