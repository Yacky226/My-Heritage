import { useCallback, useEffect, useState } from 'react';
import { decodeEventLog, isAddress, zeroAddress } from 'viem';
import type { Abi, Address, Hash } from 'viem';
import { useChainId, usePublicClient, useWatchContractEvent } from 'wagmi';
import AegisVaultArtifact from '../contracts/AegisVault.json';
import { getAegisVaultAddress } from '../contracts/address';
import type { Activity, ActivityType } from '../types';
import { sliceAddress } from '../utils/format';

const aegisVaultAbi = AegisVaultArtifact.abi as Abi;

type AegisEventName =
  | 'VaultCreated'
  | 'PingExecuted'
  | 'VaultClaimed'
  | 'VaultRevoked'
  | 'VaultHeirUpdated'
  | 'VaultCidUpdated'
  | 'VaultLocked';

type DecodedAegisEvent = {
  eventName: AegisEventName;
  args?: Record<string, unknown>;
};

type AegisLog = {
  data: Hash;
  topics: [] | [Hash, ...Hash[]];
  transactionHash?: Hash | null;
  blockNumber?: bigint | null;
  logIndex?: number | null;
  removed?: boolean;
};

function formatGas(gasUsed?: bigint) {
  if (gasUsed === undefined) return 'n/a';
  return `${gasUsed.toLocaleString()} gas`;
}

function formatEventDescription(eventName: AegisEventName, args: Record<string, unknown>) {
  const vaultId = String(args.vaultId ?? '?');

  switch (eventName) {
    case 'VaultCreated':
      return `Vault #${vaultId} created by ${sliceAddress(String(args.owner ?? ''))} for heir ${sliceAddress(String(args.heir ?? ''))}`;
    case 'PingExecuted':
      return `Proof of life sent for vault #${vaultId}`;
    case 'VaultClaimed':
      return `Vault #${vaultId} claimed by heir ${sliceAddress(String(args.heir ?? ''))}`;
    case 'VaultRevoked':
      return `Vault #${vaultId} revoked by owner`;
    case 'VaultHeirUpdated':
      return `Vault #${vaultId} heir updated from ${sliceAddress(String(args.oldHeir ?? ''))} to ${sliceAddress(String(args.newHeir ?? ''))}`;
    case 'VaultCidUpdated':
      return `Vault #${vaultId} IPFS CID updated`;
    case 'VaultLocked':
      return `Vault #${vaultId} locked against future heir changes`;
    default:
      return `${eventName} emitted for vault #${vaultId}`;
  }
}

function logKey(log: AegisLog) {
  return `${log.transactionHash ?? 'pending'}-${log.logIndex ?? 0}`;
}

function getEventVaultId(args: Record<string, unknown>) {
  const vaultId = args.vaultId;
  return vaultId === undefined || vaultId === null ? undefined : String(vaultId);
}

function getEventAddresses(args: Record<string, unknown>, txFrom?: Address) {
  const candidates = [
    args.owner,
    args.heir,
    args.oldHeir,
    args.newHeir,
    txFrom,
  ];

  return Array.from(
    new Set(
      candidates
        .map((value) => String(value ?? ''))
        .filter((value) => isAddress(value))
        .map((value) => value.toLowerCase()),
    ),
  );
}

export function useAegisEvents() {
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const aegisVaultAddress = getAegisVaultAddress(chainId);
  const readAddress = aegisVaultAddress ?? zeroAddress;
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const refetch = useCallback(() => {
    setRefreshNonce((value) => value + 1);
  }, []);

  useWatchContractEvent({
    address: readAddress,
    abi: aegisVaultAbi,
    enabled: Boolean(publicClient && aegisVaultAddress),
    onLogs: () => refetch(),
  });

  useEffect(() => {
    if (!publicClient || !aegisVaultAddress) {
      queueMicrotask(() => {
        setActivities([]);
        setIsLoading(false);
        setError(null);
      });
      return;
    }

    let cancelled = false;

    const loadEvents = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const logs = (await publicClient.getLogs({
          address: aegisVaultAddress,
          fromBlock: 0n,
          toBlock: 'latest',
        })) as AegisLog[];

        const blockNumbers = Array.from(
          new Set(
            logs
              .map((log) => log.blockNumber)
              .filter((blockNumber): blockNumber is bigint => blockNumber !== null && blockNumber !== undefined)
              .map((blockNumber) => blockNumber.toString()),
          ),
        );

        const blockEntries = await Promise.all(
          blockNumbers.map(async (blockNumberText) => {
            const blockNumber = BigInt(blockNumberText);
            const block = await publicClient.getBlock({ blockNumber });
            return [blockNumberText, Number(block.timestamp) * 1000] as const;
          }),
        );

        const transactionEntries = await Promise.all(
          Array.from(
            new Set(
              logs
                .map((log) => log.transactionHash)
                .filter((hash): hash is Hash => Boolean(hash)),
            ),
          ).map(async (hash) => {
            const [receipt, transaction] = await Promise.all([
              publicClient.getTransactionReceipt({ hash }),
              publicClient.getTransaction({ hash }),
            ]);

            return [hash, {
              gasUsed: receipt.gasUsed,
              from: transaction.from,
            }] as const;
          }),
        );

        const blockTimestamps = new Map(blockEntries);
        const transactionMetaByHash = new Map(transactionEntries);

        const nextActivities = logs
          .map((log): Activity | null => {
            try {
              const decoded = decodeEventLog({
                abi: aegisVaultAbi,
                data: log.data,
                topics: log.topics,
                strict: false,
              }) as DecodedAegisEvent;

              const eventName = decoded.eventName;
              const args = decoded.args ?? {};
              const blockNumber = log.blockNumber ?? 0n;
              const blockTimestamp = blockTimestamps.get(blockNumber.toString());
              const hash = log.transactionHash ?? '0x';
              const transactionMeta = transactionMetaByHash.get(hash as Hash);
              const txFrom = transactionMeta?.from;

              return {
                id: logKey(log),
                type: eventName as ActivityType,
                desc: formatEventDescription(eventName, args),
                date: blockTimestamp
                  ? new Date(blockTimestamp).toLocaleString()
                  : 'Pending block',
                hash,
                block: Number(blockNumber),
                gasUsed: formatGas(transactionMeta?.gasUsed),
                txFrom,
                vaultId: getEventVaultId(args),
                relatedAddresses: getEventAddresses(args, txFrom),
                status: log.removed ? 'Failed' : 'Success',
              };
            } catch (eventError) {
              console.error(eventError);
              return null;
            }
          })
          .filter((activity): activity is Activity => activity !== null)
          .sort((a, b) => {
            if (b.block !== a.block) return b.block - a.block;
            return b.id.localeCompare(a.id);
          });

        if (!cancelled) {
          setActivities(nextActivities);
        }
      } catch (eventsError) {
        console.error(eventsError);
        if (!cancelled) {
          setError(eventsError instanceof Error ? eventsError : new Error('Unable to load Aegis events'));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadEvents();

    return () => {
      cancelled = true;
    };
  }, [aegisVaultAddress, publicClient, refreshNonce]);

  return {
    activities,
    isLoading,
    error,
    refetch,
  };
}
