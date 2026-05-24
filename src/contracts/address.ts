import type { Address } from 'viem';
import {
  arbitrumSepolia,
  baseSepolia,
  hardhat,
  optimismSepolia,
  sepolia,
} from 'wagmi/chains';

const LOCAL_AEGIS_VAULT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3' as const;

function envAddress(value: string | undefined): Address | undefined {
  const trimmedValue = value?.trim();
  return trimmedValue ? (trimmedValue as Address) : undefined;
}

const sepoliaAddress = envAddress(import.meta.env.VITE_AEGIS_VAULT_ADDRESS_SEPOLIA);
const baseSepoliaAddress = envAddress(import.meta.env.VITE_AEGIS_VAULT_ADDRESS_BASE_SEPOLIA);
const arbitrumSepoliaAddress = envAddress(import.meta.env.VITE_AEGIS_VAULT_ADDRESS_ARBITRUM_SEPOLIA);
const optimismSepoliaAddress = envAddress(import.meta.env.VITE_AEGIS_VAULT_ADDRESS_OPTIMISM_SEPOLIA);

export const AEGIS_VAULT_ADDRESSES: Partial<Record<number, Address>> = {
  [hardhat.id]: LOCAL_AEGIS_VAULT_ADDRESS,
  ...(sepoliaAddress ? { [sepolia.id]: sepoliaAddress } : {}),
  ...(baseSepoliaAddress ? { [baseSepolia.id]: baseSepoliaAddress } : {}),
  ...(arbitrumSepoliaAddress ? { [arbitrumSepolia.id]: arbitrumSepoliaAddress } : {}),
  ...(optimismSepoliaAddress ? { [optimismSepolia.id]: optimismSepoliaAddress } : {}),
};

export const AEGIS_VAULT_ADDRESS = LOCAL_AEGIS_VAULT_ADDRESS;

export function getAegisVaultAddress(chainId?: number | null): Address | undefined {
  if (!chainId) return undefined;
  return AEGIS_VAULT_ADDRESSES[chainId];
}

export function getAegisVaultAddressEnvName(chainId?: number | null) {
  switch (chainId) {
    case sepolia.id:
      return 'VITE_AEGIS_VAULT_ADDRESS_SEPOLIA';
    case baseSepolia.id:
      return 'VITE_AEGIS_VAULT_ADDRESS_BASE_SEPOLIA';
    case arbitrumSepolia.id:
      return 'VITE_AEGIS_VAULT_ADDRESS_ARBITRUM_SEPOLIA';
    case optimismSepolia.id:
      return 'VITE_AEGIS_VAULT_ADDRESS_OPTIMISM_SEPOLIA';
    case hardhat.id:
      return 'local Hardhat address';
    default:
      return 'a contract address for this chainId';
  }
}
