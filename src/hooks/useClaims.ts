import { useState, useEffect, useCallback } from 'react';
import { useWallet } from './useWallet';
import { useVaults } from './useVaults';
import { useToast } from './useToast';

export interface SimulatedClaim {
  vaultId: string;
  vaultName: string;
  owner: string;
  status: 'Active' | 'Locked' | 'Cooldown' | 'Claimed';
  cooldownRemaining: number; // seconds
  fileCount: number;
  fileSize: string;
  description?: string;
  files?: Array<{ name: string; size: string }>;
}

export function useClaims() {
  const { wallet, signMessageSimulated } = useWallet();
  const { vaults, addActivity } = useVaults();
  const { addToast } = useToast();

  const [activeClaims, setActiveClaims] = useState<Record<string, { status: 'Cooldown' | 'Claimed'; cooldownRemaining: number }>>(() => {
    const saved = localStorage.getItem('aegis_claims_progress');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('aegis_claims_progress', JSON.stringify(activeClaims));
  }, [activeClaims]);

  // Tick claim cooldown timers every second
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveClaims((prev) => {
        let changed = false;
        const next = { ...prev };

        Object.keys(next).forEach((vaultId) => {
          const claimState = next[vaultId];
          if (claimState.status === 'Cooldown') {
            changed = true;
            if (claimState.cooldownRemaining <= 1) {
              // Cooldown finished! Ready to decrypt
              next[vaultId] = {
                status: 'Claimed',
                cooldownRemaining: 0,
              };
              addToast(`Claim cooldown for vault completed! Ready to decrypt files.`, 'success', 4000);
            } else {
              next[vaultId] = {
                ...claimState,
                cooldownRemaining: claimState.cooldownRemaining - 1,
              };
            }
          }
        });

        return changed ? next : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [addToast]);

  // Get inheritances where user is designated heir
  const getInheritances = useCallback((): SimulatedClaim[] => {
    if (!wallet.connected || !wallet.address) return [];

    return vaults
      .filter((vault) => {
        // Match user's connected wallet address with designated heir address
        // Handle case-insensitivity and standard mock addresses
        const userAddr = wallet.address?.toLowerCase();
        const heirAddr = vault.heir.toLowerCase();
        
        // Return true if it matches exactly or if user connected provider and address contains letters
        return heirAddr.slice(0, 8) === userAddr?.slice(0, 8) || heirAddr === userAddr;
      })
      .map((vault) => {
        const progress = activeClaims[vault.id];
        
        let status: 'Active' | 'Locked' | 'Cooldown' | 'Claimed' = vault.status;
        if (progress) {
          status = progress.status;
        }

        return {
          vaultId: vault.id,
          vaultName: vault.name,
          owner: '0x2b3c...4a5e', // Simulated owner address
          status,
          cooldownRemaining: progress?.cooldownRemaining || 0,
          fileCount: vault.fileCount,
          fileSize: vault.fileSize,
          description: vault.description,
          files: vault.files,
        };
      });
  }, [vaults, wallet.connected, wallet.address, activeClaims]);

  const initiateClaim = useCallback(async (vaultId: string) => {
    const vault = vaults.find((v) => v.id === vaultId);
    if (!vault) return;

    const sig = await signMessageSimulated(`Initiate claim request on smart contract for vault: ${vault.name}`);
    if (!sig) return;

    addToast('Broadcasting inheritance claim request to blockchain...', 'info', 1500);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Cooldown is set to 15 seconds for demonstration purposes
    setActiveClaims((prev) => ({
      ...prev,
      [vaultId]: {
        status: 'Cooldown',
        cooldownRemaining: 15,
      },
    }));

    addActivity('ClaimInitiated', `Claim initiated by heir for vault "${vault.name}"`);
    addToast('Inheritance claim pending. Safety cooldown active.', 'success', 3000);
  }, [vaults, signMessageSimulated, addToast, addActivity]);

  const decryptClaimFiles = useCallback(async (_vaultId: string, passphraseSeed: string): Promise<boolean> => {
    if (!passphraseSeed) {
      addToast('Security passphrase seed is required to derive decryption key', 'error', 3000);
      return false;
    }

    addToast('Deriving local key using PBKDF2...', 'info', 1000);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    addToast('Recombining IPFS encrypted shards...', 'info', 1000);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    addToast('Decrypting package blocks locally...', 'info', 1200);
    await new Promise((resolve) => setTimeout(resolve, 1200));

    addToast('Decompressing payload integrity verified!', 'success', 2000);
    addActivity('VaultDecrypted', `Decrypted files for claimed vault`);

    return true;
  }, [addToast, addActivity]);

  return {
    getInheritances,
    initiateClaim,
    decryptClaimFiles,
    activeClaims,
  };
}
