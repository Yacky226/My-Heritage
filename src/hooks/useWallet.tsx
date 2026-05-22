import { createContext, useContext, useCallback } from 'react';
import type { ReactNode } from 'react';
import {
  useConnection,
  useConnect,
  useConnectors,
  useDisconnect,
  useChainId,
  useSignMessage,
} from 'wagmi';
import { hardhat } from 'wagmi/chains';
import type { WalletState } from '../types';
import { useToast } from './useToast';

interface WalletContextProps {
  wallet: WalletState;
  connectWallet: (providerName: string) => Promise<boolean>;
  disconnectWallet: () => void;
  switchNetwork: (networkName: string) => void;
  signMessageSimulated: (msg: string) => Promise<string | null>;
  isConnecting: boolean;
  activeProvider: string | null;
}

const WalletContext = createContext<WalletContextProps | undefined>(undefined);

function getNetworkName(chainId?: number) {
  if (chainId === hardhat.id) return 'Hardhat Local';
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
          chainId: hardhat.id,
        });

        addToast('Wallet connected successfully', 'success', 2500);
        return true;
      } catch (error) {
        console.error(error);
        addToast('Wallet connection failed', 'error', 3000);
        return false;
      }
    },
    [connectors, connectMutation, addToast],
  );

  const disconnectWallet = useCallback(() => {
    disconnectMutation.mutate({});
    addToast('Wallet disconnected', 'info', 2000);
  }, [disconnectMutation, addToast]);

  const switchNetwork = useCallback(
    (_networkName: string) => {
      addToast('Please switch network from your wallet if needed', 'info', 3000);
    },
    [addToast],
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
        isConnecting: connectMutation.isPending,
        activeProvider: connectMutation.variables?.connector?.name ?? null,
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