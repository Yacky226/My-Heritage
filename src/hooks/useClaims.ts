import { useCallback, useEffect, useState } from 'react';
import type { Address } from 'viem';
import { useWallet } from './useWallet';
import { useAegisVault } from './useAegisVault';
import { useToast } from './useToast';
import { formatTimeRemaining } from '../utils/format';
import type { ClaimStatus } from '../types';

export interface HeirClaim {
  vaultId: string;
  vaultName: string;
  owner: string;
  heir: string;
  status: ClaimStatus;
  canClaim: boolean;
  revoked: boolean;
  locked: boolean;
  ipfsCid?: string;
  lastPingTimestamp: number;
  unlockTimestamp: number;
  secondsUntilUnlock: number;
  fileCount: number;
  fileSize: string;
  description?: string;
  files?: Array<{ name: string; size: string }>;
}

export function useClaims() {
  const { wallet } = useWallet();
  const { addToast } = useToast();
  const aegisVault = useAegisVault(null, wallet.address as Address | null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const getInheritances = useCallback((): HeirClaim[] => {
    if (!wallet.connected || !wallet.address) return [];

    return aegisVault.heirVaults.map((vault) => {
      const unlockTimestamp = vault.unlockTimestamp ?? vault.lastPingTimestamp;
      const secondsUntilUnlock = Math.max(
        0,
        Math.ceil((unlockTimestamp - now) / 1000),
      );
      const canClaim = Boolean(
        !vault.revoked &&
        !vault.claimed &&
        now > unlockTimestamp,
      );
      const status: ClaimStatus = vault.claimed
        ? 'Claimed'
        : vault.revoked || canClaim
          ? 'Locked'
          : 'Active';

      return {
        vaultId: vault.id,
        vaultName: vault.name,
        owner: vault.owner ?? '',
        heir: vault.heir,
        status,
        canClaim,
        revoked: Boolean(vault.revoked),
        locked: Boolean(vault.locked),
        ipfsCid: vault.ipfsCid,
        lastPingTimestamp: vault.lastPingTimestamp,
        unlockTimestamp,
        secondsUntilUnlock,
        fileCount: vault.fileCount,
        fileSize: vault.fileSize,
        description: vault.description,
        files: vault.files?.map((file) => ({
          name: file.name,
          size: file.size,
        })),
      };
    });
  }, [
    aegisVault.heirVaults,
    wallet.connected,
    wallet.address,
    now,
  ]);

  const initiateClaim = useCallback(
    async (vaultId: string): Promise<boolean> => {
      if (!wallet.connected || !wallet.address) {
        addToast('Please connect your wallet first', 'error', 3000);
        return false;
      }

      const vault = aegisVault.heirVaults.find((item) => item.id === vaultId);

      if (!vault) {
        addToast('Inheritance vault not found for this wallet', 'error', 3000);
        return false;
      }

      if (vault.revoked) {
        addToast('This vault was revoked by its owner', 'error', 3000);
        return false;
      }

      if (vault.claimed) {
        addToast('This vault has already been claimed', 'info', 3000);
        return false;
      }

      const unlockTimestamp = vault.unlockTimestamp ?? vault.lastPingTimestamp;
      const claimableNow = Date.now() > unlockTimestamp;

      if (!claimableNow) {
        const secondsUntilUnlock = Math.max(
          0,
          Math.ceil((unlockTimestamp - Date.now()) / 1000),
        );
        addToast(
          `Owner is still active. Unlock window opens in ${formatTimeRemaining(secondsUntilUnlock)}.`,
          'info',
          4000,
        );
        return false;
      }

      try {
        addToast('Submitting inheritance claim transaction...', 'info', 2000);
        await aegisVault.claimVault(BigInt(vaultId));
        addToast('Vault claimed on-chain. IPFS recovery is now authorized.', 'success', 3500);
        aegisVault.refetch();
        return true;
      } catch (error) {
        console.error(error);
        addToast('Claim transaction failed', 'error', 3000);
        return false;
      }
    },
    [
      aegisVault,
      addToast,
      wallet.connected,
      wallet.address,
    ],
  );

  return {
    getInheritances,
    initiateClaim,
    isLoading: aegisVault.isLoading,
    isClaiming: aegisVault.isWriting || aegisVault.isConfirming,
    refetch: aegisVault.refetch,
  };
}
