import { useMemo } from 'react';
import {
  usePublicClient,
  useReadContract,
  useReadContracts,
  useChainId,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';
import { zeroAddress } from 'viem';
import type { Abi, Address } from 'viem';
import AegisVaultArtifact from '../contracts/AegisVault.json';
import {
  getAegisVaultAddress,
  getAegisVaultAddressEnvName,
} from '../contracts/address';
import type { Vault, VaultStatus } from '../types';

const aegisVaultAbi = AegisVaultArtifact.abi as Abi;

type ContractVault = {
  id: bigint;
  owner: Address;
  heir: Address;
  ipfsCid: string;
  lastPing: bigint;
  inactivityDelay: bigint;
  revoked: boolean;
  claimed: boolean;
  locked: boolean;
};

function formatRelativeTime(timestampMs: number) {
  const diffMs = Math.max(Date.now() - timestampMs, 0);
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} min ago`;
  return 'Just now';
}

function getVaultStatus(vault: ContractVault): VaultStatus {
  if (vault.claimed) return 'Claimed';
  if (vault.revoked) return 'Locked';

  const expiresAtMs =
    (Number(vault.lastPing) + Number(vault.inactivityDelay)) * 1000;

  if (Date.now() > expiresAtMs) return 'Locked';

  return 'Active';
}

function mapContractVaultToUiVault(vault: ContractVault): Vault {
  const lastPingTimestamp = Number(vault.lastPing) * 1000;
  const inactivityDelaySeconds = Number(vault.inactivityDelay);
  const unlockTimestamp =
    (Number(vault.lastPing) + inactivityDelaySeconds) * 1000;
  const isClaimable =
    !vault.revoked &&
    !vault.claimed &&
    Date.now() > unlockTimestamp;
  const inactivityDays = Math.max(
    1,
    Math.ceil(inactivityDelaySeconds / 86400),
  );

  return {
    id: vault.id.toString(),
    owner: vault.owner,
    name: `Aegis Vault #${vault.id.toString()}`,
    heir: vault.heir,
    status: getVaultStatus(vault),
    ipfsCid: vault.ipfsCid,
    lastPing: formatRelativeTime(lastPingTimestamp),
    lastPingTimestamp,
    unlockTimestamp,
    inactivityDelaySeconds,
    isClaimable,
    revoked: vault.revoked,
    claimed: vault.claimed,
    locked: vault.locked,
    inactivityTimer: `${inactivityDays} day${inactivityDays > 1 ? 's' : ''}`,
    inactivityDays,
    createdAt: new Date(lastPingTimestamp).toLocaleDateString(),
    fileCount: vault.ipfsCid ? 1 : 0,
    fileSize: 'Encrypted IPFS payload',
    description: `IPFS CID: ${vault.ipfsCid}`,
    files: vault.ipfsCid
      ? [{ name: vault.ipfsCid, size: 'IPFS', type: 'application/octet-stream' }]
      : [],
  };
}

export function useAegisVault(ownerAddress?: Address | null, heirAddress?: Address | null) {
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const aegisVaultAddress = getAegisVaultAddress(chainId);
  const readAddress = aegisVaultAddress ?? zeroAddress;
  const contractEnabled = Boolean(aegisVaultAddress);

  const ownerVaultIdsQuery = useReadContract({
    address: readAddress,
    abi: aegisVaultAbi,
    functionName: 'getOwnerVaults',
    args: ownerAddress ? [ownerAddress] : undefined,
    query: {
      enabled: Boolean(ownerAddress && contractEnabled),
    },
  });

  const heirVaultIdsQuery = useReadContract({
    address: readAddress,
    abi: aegisVaultAbi,
    functionName: 'getHeirVaults',
    args: heirAddress ? [heirAddress] : undefined,
    query: {
      enabled: Boolean(heirAddress && contractEnabled),
    },
  });

  const ownerVaultIds = (ownerVaultIdsQuery.data ?? []) as bigint[];
  const heirVaultIds = (heirVaultIdsQuery.data ?? []) as bigint[];

  const ownerVaultsQuery = useReadContracts({
    contracts: aegisVaultAddress
      ? ownerVaultIds.map((vaultId) => ({
          address: aegisVaultAddress,
          abi: aegisVaultAbi,
          functionName: 'getVault',
          args: [vaultId],
        }))
      : [],
    query: {
      enabled: ownerVaultIds.length > 0 && contractEnabled,
    },
  });

  const heirVaultsQuery = useReadContracts({
    contracts: aegisVaultAddress
      ? heirVaultIds.map((vaultId) => ({
          address: aegisVaultAddress,
          abi: aegisVaultAbi,
          functionName: 'getVault',
          args: [vaultId],
        }))
      : [],
    query: {
      enabled: heirVaultIds.length > 0 && contractEnabled,
    },
  });

  const writeMutation = useWriteContract();

  const receiptQuery = useWaitForTransactionReceipt({
    hash: writeMutation.data,
  });

  const getReadyPublicClient = async () => {
    if (!publicClient) {
      throw new Error('Unable to access the active RPC client.');
    }

    if (!aegisVaultAddress) {
      const envName = getAegisVaultAddressEnvName(chainId);
      throw new Error(
        `AegisVault is not configured for chain ${chainId}. Deploy the contract on this network and set ${envName}.`,
      );
    }

    const bytecode = await publicClient.getBytecode({
      address: aegisVaultAddress,
    });

    if (!bytecode || bytecode === '0x') {
      throw new Error(
        `AegisVault is not deployed at ${aegisVaultAddress} on chain ${chainId}. Deploy the contract on this network before using this action.`,
      );
    }

    return {
      address: aegisVaultAddress,
      client: publicClient,
    };
  };

  const waitForWrite = async (hash: `0x${string}`) => {
    const { client } = await getReadyPublicClient();
    await client.waitForTransactionReceipt({ hash });
    return hash;
  };

  const ownerVaults = useMemo(() => {
    if (ownerVaultIds.length === 0) return [];

    return (ownerVaultsQuery.data ?? [])
      .filter((result) => result.status === 'success')
      .map((result) => mapContractVaultToUiVault(result.result as ContractVault));
  }, [ownerVaultIds.length, ownerVaultsQuery.data]);

  const heirVaults = useMemo(() => {
    if (heirVaultIds.length === 0) return [];

    return (heirVaultsQuery.data ?? [])
      .filter((result) => result.status === 'success')
      .map((result) => mapContractVaultToUiVault(result.result as ContractVault));
  }, [heirVaultIds.length, heirVaultsQuery.data]);

  const createVault = async (
    heir: Address,
    ipfsCid: string,
    inactivityDelay: bigint,
  ) => {
    const { address } = await getReadyPublicClient();

    const hash = await writeMutation.mutateAsync({
      address,
      abi: aegisVaultAbi,
      functionName: 'createVault',
      args: [heir, ipfsCid, inactivityDelay],
    });

    return waitForWrite(hash);
  };

  const pingVault = async (vaultId: bigint) => {
    const { address } = await getReadyPublicClient();

    const hash = await writeMutation.mutateAsync({
      address,
      abi: aegisVaultAbi,
      functionName: 'ping',
      args: [vaultId],
    });

    return waitForWrite(hash);
  };

  const claimVault = async (vaultId: bigint) => {
    const { address } = await getReadyPublicClient();

    const hash = await writeMutation.mutateAsync({
      address,
      abi: aegisVaultAbi,
      functionName: 'claimVault',
      args: [vaultId],
    });

    return waitForWrite(hash);
  };

  const revokeVault = async (vaultId: bigint) => {
    const { address } = await getReadyPublicClient();

    const hash = await writeMutation.mutateAsync({
      address,
      abi: aegisVaultAbi,
      functionName: 'revokeVault',
      args: [vaultId],
    });

    return waitForWrite(hash);
  };

  const updateHeir = async (
    vaultId: bigint,
    newHeir: Address,
    newIpfsCid: string,
  ) => {
    const { address } = await getReadyPublicClient();

    const hash = await writeMutation.mutateAsync({
      address,
      abi: aegisVaultAbi,
      functionName: 'updateHeir',
      args: [vaultId, newHeir, newIpfsCid],
    });

    return waitForWrite(hash);
  };

  const updateCid = async (vaultId: bigint, newIpfsCid: string) => {
    const { address } = await getReadyPublicClient();

    const hash = await writeMutation.mutateAsync({
      address,
      abi: aegisVaultAbi,
      functionName: 'updateCid',
      args: [vaultId, newIpfsCid],
    });

    return waitForWrite(hash);
  };

  const lockVault = async (vaultId: bigint) => {
    const { address } = await getReadyPublicClient();

    const hash = await writeMutation.mutateAsync({
      address,
      abi: aegisVaultAbi,
      functionName: 'lockVault',
      args: [vaultId],
    });

    return waitForWrite(hash);
  };

  const refetch = () => {
    ownerVaultIdsQuery.refetch();
    heirVaultIdsQuery.refetch();
    ownerVaultsQuery.refetch();
    heirVaultsQuery.refetch();
  };

  return {
    ownerVaults,
    heirVaults,
    ownerVaultIds,
    heirVaultIds,
    chainId,
    aegisVaultAddress,
    isUnsupportedNetwork: !contractEnabled,
    createVault,
    pingVault,
    claimVault,
    revokeVault,
    updateHeir,
    updateCid,
    lockVault,
    refetch,
    isLoading:
      ownerVaultIdsQuery.isLoading ||
      heirVaultIdsQuery.isLoading ||
      ownerVaultsQuery.isLoading ||
      heirVaultsQuery.isLoading,
    error:
      ownerVaultIdsQuery.error ||
      heirVaultIdsQuery.error ||
      ownerVaultsQuery.error ||
      heirVaultsQuery.error,
    isWriting: writeMutation.isPending,
    isConfirming: receiptQuery.isLoading,
    isConfirmed: receiptQuery.isSuccess,
    writeHash: writeMutation.data,
    writeError: writeMutation.error || receiptQuery.error,
  };
}
