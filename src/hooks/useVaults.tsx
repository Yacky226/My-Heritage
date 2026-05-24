import { createContext, useContext, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { getAddress, isAddress } from 'viem';
import type { Address } from 'viem';
import type { Activity, ActivityType, Vault, VaultFile } from '../types';
import { useToast } from './useToast';
import { useWallet } from './useWallet';
import { useAegisVault } from './useAegisVault';
import { useAegisEvents } from './useAegisEvents';
import { uploadVaultPayloadToIpfs } from '../services/ipfs';

interface VaultsContextProps {
  vaults: Vault[];
  activities: Activity[];
  createVault: (
    name: string,
    heir: string,
    inactivityDelaySeconds: number,
    description: string,
    files: VaultFile[],
    heirEncryptionPublicKey: JsonWebKey,
  ) => Promise<boolean>;
  pingVault: (id: string) => Promise<boolean>;
  deleteVault: (id: string) => Promise<boolean>;
  updateVaultTimer: (id: string, days: number) => void;
  updateVaultHeir: (id: string, heir: string) => Promise<boolean>;
  addActivity: (type: ActivityType, desc: string) => void;
  refetch: () => void;
  isLoading: boolean;
}

const VaultsContext = createContext<VaultsContextProps | undefined>(undefined);

export function VaultsProvider({ children }: { children: ReactNode }) {
  const { addToast } = useToast();
  const { wallet } = useWallet();
  const aegisVault = useAegisVault(
    wallet.address as Address | null,
    wallet.address as Address | null,
  );
  const aegisEvents = useAegisEvents();
  const walletAddress = wallet.address?.toLowerCase() ?? null;

  const scopedActivities = useMemo(() => {
    if (!walletAddress) return [];

    const relatedVaultIds = new Set([
      ...aegisVault.ownerVaults.map((vault) => vault.id),
      ...aegisVault.heirVaults.map((vault) => vault.id),
    ]);

    return aegisEvents.activities.filter((activity) => {
      const matchesWalletAddress =
        activity.txFrom?.toLowerCase() === walletAddress ||
        activity.relatedAddresses?.some((address) => address.toLowerCase() === walletAddress);
      const matchesWalletVault =
        activity.vaultId !== undefined && relatedVaultIds.has(activity.vaultId);

      return Boolean(matchesWalletAddress || matchesWalletVault);
    });
  }, [
    aegisEvents.activities,
    aegisVault.heirVaults,
    aegisVault.ownerVaults,
    walletAddress,
  ]);

  const addActivity = useCallback((type: ActivityType, desc: string) => {
    void type;
    void desc;
    // Activities now come from Solidity events. This adapter remains to avoid
    // breaking older components while the ActivityExplorer is migrated.
  }, []);

  const createVault = useCallback(
    async (
      name: string,
      heir: string,
      inactivityDelaySeconds: number,
      description: string,
      files: VaultFile[],
      heirEncryptionPublicKey: JsonWebKey,
    ): Promise<boolean> => {
      if (!wallet.connected || !wallet.address) {
        addToast('Please connect your wallet first', 'error', 3000);
        return false;
      }

      if (aegisVault.isUnsupportedNetwork || !aegisVault.aegisVaultAddress) {
        addToast(`AegisVault is not configured on ${wallet.network}`, 'error', 4000);
        return false;
      }

      const cleanHeir = heir.trim();

      if (!isAddress(cleanHeir)) {
        addToast('Invalid heir address', 'error', 3000);
        return false;
      }

      const inactivityDelay = BigInt(Math.max(1, Math.floor(inactivityDelaySeconds)));

      try {
        addToast('Uploading vault payload to IPFS...', 'info', 2500);

        const upload = await uploadVaultPayloadToIpfs({
          vaultName: name,
          description,
          heir: getAddress(cleanHeir),
          heirEncryptionPublicKey,
          files,
        });

        addToast('Submitting vault creation transaction...', 'info', 2000);

        await aegisVault.createVault(
          getAddress(cleanHeir),
          upload.cid,
          inactivityDelay,
        );

        addToast(`Digital Vault created on-chain with IPFS CID ${upload.cid.slice(0, 10)}...`, 'success', 3500);
        aegisVault.refetch();
        aegisEvents.refetch();
        return true;
      } catch (error) {
        console.error(error);
        addToast(error instanceof Error ? error.message : 'Vault creation failed', 'error', 5000);
        return false;
      }
    },
    [aegisVault, aegisEvents, addToast, wallet.connected, wallet.address, wallet.network],
  );

  const pingVault = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        addToast('Submitting proof-of-life transaction...', 'info', 2000);
        await aegisVault.pingVault(BigInt(id));
        addToast('Vault timer reset on-chain!', 'success', 3000);
        aegisVault.refetch();
        aegisEvents.refetch();
        return true;
      } catch (error) {
        console.error(error);
        addToast('Proof-of-life transaction failed', 'error', 3000);
        return false;
      }
    },
    [aegisVault, aegisEvents, addToast],
  );

  const deleteVault = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        addToast('Submitting vault revocation transaction...', 'info', 2000);
        await aegisVault.revokeVault(BigInt(id));
        addToast('Vault revoked on-chain', 'success', 3000);
        aegisVault.refetch();
        aegisEvents.refetch();
        return true;
      } catch (error) {
        console.error(error);
        addToast('Vault revocation failed', 'error', 3000);
        return false;
      }
    },
    [aegisVault, aegisEvents, addToast],
  );

  const updateVaultTimer = useCallback(
    (id: string, days: number) => {
      void id;
      void days;
      addToast('Timer update is not enabled in the current smart contract', 'info', 3000);
    },
    [addToast],
  );

  const updateVaultHeir = useCallback(
    async (id: string, heir: string): Promise<boolean> => {
      void id;
      const cleanHeir = heir.trim();

      if (!isAddress(cleanHeir)) {
        addToast('Invalid heir address', 'error', 3000);
        return false;
      }

      addToast(
        'Heir update now requires re-uploading a payload for the new heir. This will be connected with the encryption step.',
        'info',
        5000,
      );
      return false;
    },
    [addToast],
  );

  return (
    <VaultsContext.Provider
      value={{
        vaults: aegisVault.ownerVaults,
        activities: scopedActivities,
        createVault,
        pingVault,
        deleteVault,
        updateVaultTimer,
        updateVaultHeir,
        addActivity,
        refetch: aegisVault.refetch,
        isLoading:
          aegisVault.isLoading ||
          aegisVault.isWriting ||
          aegisVault.isConfirming,
      }}
    >
      {children}
    </VaultsContext.Provider>
  );
}

export function useVaults() {
  const context = useContext(VaultsContext);

  if (!context) {
    throw new Error('useVaults must be used within a VaultsProvider');
  }

  return context;
}

if (import.meta.hot) {
  import.meta.hot.accept(() => {
    import.meta.hot?.invalidate();
  });
}
