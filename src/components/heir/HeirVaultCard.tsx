import { useState } from 'react';
import { useClaims } from '../../hooks/useClaims';
import type { HeirClaim } from '../../hooks/useClaims';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { sliceAddress } from '../../utils/format';
import { formatTimeRemaining } from '../../utils/format';
import { downloadIpfsPayload } from '../../services/ipfs';
import {
  decryptVaultPayloadWithPrivateKey,
  parseEncryptionPrivateKey,
} from '../../services/crypto';
import type { DecryptedVaultFile } from '../../services/crypto';
import { Vault as VaultIcon, ShieldAlert, Key, ShieldCheck, Download, CheckCircle, FileText } from 'lucide-react';

interface HeirVaultCardProps {
  claim: HeirClaim;
}

export function HeirVaultCard({ claim }: HeirVaultCardProps) {
  const { initiateClaim, isClaiming } = useClaims();
  const [privateKeyJson, setPrivateKeyJson] = useState('');
  const [decryptionProgress, setDecryptionProgress] = useState(0);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDecrypted, setIsDecrypted] = useState(false);
  const [decryptedFiles, setDecryptedFiles] = useState<DecryptedVaultFile[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  const handleInitiate = async () => {
    await initiateClaim(claim.vaultId);
  };

  const handleDecrypt = async () => {
    if (!privateKeyJson.trim()) {
      setErrorMsg('Paste your private encryption key JSON');
      return;
    }

    if (!claim.ipfsCid) {
      setErrorMsg('No IPFS CID is registered for this vault');
      return;
    }

    try {
      setErrorMsg('');
      setIsDecrypting(true);
      setDecryptionProgress(10);

      const privateKey = parseEncryptionPrivateKey(privateKeyJson);
      setDecryptionProgress(25);

      const payload = await downloadIpfsPayload(claim.ipfsCid);
      setDecryptionProgress(55);

      const clearFiles = await decryptVaultPayloadWithPrivateKey(payload, privateKey);
      setDecryptedFiles(clearFiles);
      setDecryptionProgress(100);
      setIsDecrypted(true);
    } catch (error) {
      console.error(error);
      setErrorMsg(error instanceof Error ? error.message : 'Unable to decrypt IPFS payload');
      setIsDecrypting(false);
      setDecryptionProgress(0);
      return;
    }

    setIsDecrypting(false);
  };

  const downloadDecryptedFile = (file: DecryptedVaultFile) => {
    const url = URL.createObjectURL(file.blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    decryptedFiles.forEach((file) => downloadDecryptedFile(file));
  };

  const handleDownloadIpfsPayload = async () => {
    if (!claim.ipfsCid) {
      setErrorMsg('No IPFS CID is registered for this vault');
      return;
    }

    try {
      setErrorMsg('');
      setIsDownloading(true);
      const payload = await downloadIpfsPayload(claim.ipfsCid);
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = `${claim.vaultName.toLowerCase().replace(/\s+/g, '_')}_ipfs_payload.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      setErrorMsg(error instanceof Error ? error.message : 'Unable to download IPFS payload');
    } finally {
      setIsDownloading(false);
    }
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
              <span>
                Owner is active. Claim opens in {formatTimeRemaining(claim.secondsUntilUnlock)}.
              </span>
            </div>
          </Alert>
        )}

        {claim.status === 'Locked' && (
          <div className="flex flex-col gap-3">
            <Alert type={claim.revoked ? 'warning' : 'danger'} className="py-2.5 px-3">
              <div className="flex items-center gap-2 text-xs">
                <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 animate-bounce" />
                <span>
                  {claim.revoked
                    ? 'This vault was revoked by its owner and cannot be claimed.'
                    : 'Owner inactivity threshold expired. Smart contract claim is available.'}
                </span>
              </div>
            </Alert>
            {!claim.revoked && (
              <Button
                variant="primary"
                size="sm"
                loading={isClaiming}
                onClick={handleInitiate}
                disabled={!claim.canClaim}
                className="w-full text-xs shadow-md shadow-blue-500/10"
                icon={<ShieldCheck className="w-4 h-4" />}
              >
                Claim Vault On-Chain
              </Button>
            )}
          </div>
        )}

        {claim.status === 'Claimed' && (
          <div className="flex flex-col gap-3 pt-1">
            {!isDecrypted ? (
              <>
                <div className="text-left w-full">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-350 mb-2">
                    Private Encryption Key (JWK)
                  </label>
                  <textarea
                    className={`w-full rounded-xl border bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-100 placeholder-slate-450 dark:placeholder-slate-550 text-xs font-mono p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none h-28 resize-y disabled:bg-slate-50 dark:disabled:bg-slate-950/40 disabled:text-slate-400 ${
                      errorMsg
                        ? 'border-rose-300 dark:border-rose-900/50 focus:ring-rose-500/20 focus:border-rose-500'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                    placeholder='{"kty":"EC","crv":"P-256","x":"...","y":"...","d":"..."}'
                    value={privateKeyJson}
                    onChange={(e) => setPrivateKeyJson(e.target.value)}
                    disabled={isDecrypting}
                  />
                  {errorMsg ? (
                    <p className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-450">
                      {errorMsg}
                    </p>
                  ) : (
                    <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500 font-medium">
                      This key stays in the browser and is used locally to unwrap the encrypted IPFS payload.
                    </p>
                  )}
                </div>
                <Alert type="warning" className="py-2.5 px-3">
                  <div className="text-xs text-amber-800 dark:text-amber-350">
                    On-chain claim is complete. Decryption runs locally with your private key; Aegis never sends that key to IPFS or the smart contract.
                  </div>
                </Alert>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleDownloadIpfsPayload}
                  loading={isDownloading}
                  className="w-full text-xs shadow-md shadow-blue-500/10"
                  icon={<Download className="w-4 h-4" />}
                >
                  Download IPFS Payload
                </Button>
                
                {isDecrypting ? (
                  <div className="flex flex-col gap-2">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${decryptionProgress}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider text-right">
                      {decryptionProgress < 100 ? 'Decrypting IPFS Payload Locally...' : 'Payload Decrypted'}
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
                    Decrypt IPFS Payload
                  </Button>
                )}
              </>
            ) : (
              <div className="flex flex-col gap-3">
                <Alert type="success" className="py-2.5 px-3">
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Vault decrypted locally. Files are ready to download.</span>
                  </div>
                </Alert>
                
                {/* Decrypted files list */}
                <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden mb-1.5">
                  <div className="bg-slate-50 dark:bg-slate-950/60 p-2 border-b border-slate-100 dark:border-slate-850 text-2xs font-semibold text-slate-450 uppercase tracking-widest">
                    Decrypted Files
                  </div>
                  <div className="p-2.5 flex flex-col gap-1.5 bg-white dark:bg-slate-900">
                    {decryptedFiles.map((file) => (
                      <div key={file.name} className="flex justify-between items-center gap-3 text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 min-w-0 truncate">
                          <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          {file.name}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadDecryptedFile(file)}
                          className="text-[10px] px-2 py-1 shrink-0"
                          icon={<Download className="w-3.5 h-3.5" />}
                        >
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleDownloadAll}
                  disabled={decryptedFiles.length === 0}
                  className="w-full text-xs shadow-md shadow-emerald-500/10"
                  icon={<Download className="w-4 h-4" />}
                >
                  Download All Decrypted Files
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
