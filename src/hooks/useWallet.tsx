import { createContext, useContext, useCallback } from 'react';
import type { ReactNode } from 'react';
import {
  useConnection,
  useConnect,
  useConnectors,
  useDisconnect,
  useChainId,
  useSignMessage,
  useSwitchChain,
} from 'wagmi';
import { hardhat } from 'wagmi/chains';
import type { WalletState } from '../types';
import { useToast } from './useToast';
import {
  isSupportedChainId,
  supportedNetworks,
} from '../web3/config';

interface WalletContextProps {
  wallet: WalletState;
  connectWallet: (providerName: string) => Promise<boolean>;
  disconnectWallet: () => void;
  switchNetwork: (chainId: number) => Promise<boolean>;
  signMessageSimulated: (msg: string) => Promise<string | null>;
  isConnecting: boolean;
  activeProvider: string | null;
  supportedNetworks: typeof supportedNetworks;
}

const WalletContext = createContext<WalletContextProps | undefined>(undefined);

function getNetworkName(chainId?: number) {
  const supportedNetwork = supportedNetworks.find((network) => network.id === chainId);
  if (supportedNetwork) return supportedNetwork.name;
  if (!chainId) return 'Unknown Network';
  return `Chain ${chainId}`;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const { addToast } = useToast();

  const connection = useConnection();
  const chainId = useChainId();
  const connectors = useConnectors();

  const connectMutation = useConnect();
  const disconnectMutation = useDisconnect();
  const signMessageMutation = useSignMessage();
  const switchChainMutation = useSwitchChain();

  const wallet: WalletState = {
    connected: connection.isConnected,
    address: connection.address ?? null,
    provider: connection.connector?.name ?? null,
    network: getNetworkName(chainId),
  };

  const connectWallet = useCallback(
    async (providerName: string): Promise<boolean> => {
      try {
        const selectedConnector =
          connectors.find((item) => item.name === providerName) ?? connectors[0];

        if (!selectedConnector) {
          addToast('No wallet connector available', 'error', 3000);
          return false;
        }

        addToast(`Connecting to ${selectedConnector.name}...`, 'info', 1500);

        await connectMutation.mutateAsync({
          connector: selectedConnector,
          chainId: isSupportedChainId(chainId) ? chainId : hardhat.id,
        });

        addToast('Wallet connected successfully', 'success', 2500);
        return true;
      } catch (error) {
        console.error(error);
        addToast('Wallet connection failed', 'error', 3000);
        return false;
      }
    },
    [chainId, connectors, connectMutation, addToast],
  );

  const disconnectWallet = useCallback(() => {
    disconnectMutation.mutate({});
    addToast('Wallet disconnected', 'info', 2000);
  }, [disconnectMutation, addToast]);

  const switchNetwork = useCallback(
    async (nextChainId: number): Promise<boolean> => {
      const targetNetwork = supportedNetworks.find((network) => network.id === nextChainId);

      if (!targetNetwork) {
        addToast(`Chain ${nextChainId} is not supported by Aegis`, 'error', 3000);
        return false;
      }

      if (chainId === nextChainId) {
        return true;
      }

      try {
        addToast(`Switching to ${targetNetwork.name}...`, 'info', 1500);
        await switchChainMutation.switchChainAsync({ chainId: nextChainId });
        addToast(`Network switched to ${targetNetwork.name}`, 'success', 2500);
        return true;
      } catch (error) {
        console.error(error);
        addToast(`Unable to switch to ${targetNetwork.name}`, 'error', 3000);
        return false;
      }
    },
    [addToast, chainId, switchChainMutation],
  );

  const signMessageSimulated = useCallback(
    async (msg: string): Promise<string | null> => {
      if (!connection.isConnected || !connection.address) {
        addToast('Please connect your wallet first', 'error', 3000);
        return null;
      }

      try {
        addToast('Requesting signature in wallet...', 'info', 1500);

        const signature = await signMessageMutation.mutateAsync({
          message: msg,
        });

        addToast('Message signed successfully', 'success', 2500);
        return signature;
      } catch (error) {
        console.error(error);
        addToast('Signature rejected or failed', 'error', 3000);
        return null;
      }
    },
    [connection.isConnected, connection.address, signMessageMutation, addToast],
  );

  return (
    <WalletContext.Provider
      value={{
        wallet,
        connectWallet,
        disconnectWallet,
        switchNetwork,
        signMessageSimulated,
        isConnecting: connectMutation.isPending || switchChainMutation.isPending,
        activeProvider: connectMutation.variables?.connector?.name ?? null,
        supportedNetworks,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);

  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }

  return context;
}
