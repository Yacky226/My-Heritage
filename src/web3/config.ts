import { http, createConfig } from 'wagmi';
import {
  arbitrumSepolia,
  baseSepolia,
  hardhat,
  optimismSepolia,
  sepolia,
} from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

export const supportedChains = [
  hardhat,
  sepolia,
  baseSepolia,
  arbitrumSepolia,
  optimismSepolia,
] as const;

export const supportedNetworks = supportedChains.map((chain) => ({
  id: chain.id,
  name: chain.id === hardhat.id ? 'Hardhat Local' : chain.name,
}));

export function isSupportedChainId(chainId?: number | null) {
  return supportedChains.some((chain) => chain.id === chainId);
}

export const wagmiConfig = createConfig({
  chains: supportedChains,
  connectors: [injected()],
  transports: {
    [hardhat.id]: http(import.meta.env.VITE_HARDHAT_RPC_URL || 'http://127.0.0.1:8545'),
    [sepolia.id]: http(import.meta.env.VITE_SEPOLIA_RPC_URL || undefined),
    [baseSepolia.id]: http(import.meta.env.VITE_BASE_SEPOLIA_RPC_URL || undefined),
    [arbitrumSepolia.id]: http(import.meta.env.VITE_ARBITRUM_SEPOLIA_RPC_URL || undefined),
    [optimismSepolia.id]: http(import.meta.env.VITE_OPTIMISM_SEPOLIA_RPC_URL || undefined),
  },
});
