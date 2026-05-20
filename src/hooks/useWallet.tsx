import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
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

export function WalletProvider({ children }: { children: ReactNode }) {
  const { addToast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  
  const [wallet, setWallet] = useState<WalletState>(() => {
    const saved = localStorage.getItem('aegis_wallet');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return {
      connected: false,
      address: null,
      provider: null,
      network: 'Ethereum Mainnet',
    };
  });

  useEffect(() => {
    localStorage.setItem('aegis_wallet', JSON.stringify(wallet));
  }, [wallet]);

  const connectWallet = useCallback(async (providerName: string): Promise<boolean> => {
    setIsConnecting(true);
    setActiveProvider(providerName);
    addToast(`Connecting to ${providerName}...`, 'info', 1500);

    // Simulate Web3 wallet handshake delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const mockAddresses: Record<string, string> = {
      MetaMask: '0x71C6793Bfc6F0b7b1348EF853a479B4Cd0C09A23',
      WalletConnect: '0x5e8F1aC8F7E41C7771746B316D7f8b9A2b3c10D9',
      Coinbase: '0x9d164F1AC4d41C7f71B36D8b92b3c10D9A2A38FC',
    };

    const targetAddress = mockAddresses[providerName] || '0x0000000000000000000000000000000000000000';

    setWallet({
      connected: true,
      address: targetAddress,
      provider: providerName,
      network: 'Ethereum Mainnet',
    });

    setIsConnecting(false);
    setActiveProvider(null);
    addToast('Wallet connected successfully', 'success', 2500);
    return true;
  }, [addToast]);

  const disconnectWallet = useCallback(() => {
    setWallet({
      connected: false,
      address: null,
      provider: null,
      network: 'Ethereum Mainnet',
    });
    addToast('Wallet disconnected', 'info', 2000);
  }, [addToast]);

  const switchNetwork = useCallback((networkName: string) => {
    setWallet((prev) => ({
      ...prev,
      network: networkName,
    }));
    addToast(`Switched network to ${networkName}`, 'success', 2000);
  }, [addToast]);

  const signMessageSimulated = useCallback(async (_msg: string): Promise<string | null> => {
    if (!wallet.connected || !wallet.address) {
      addToast('Please connect your wallet first', 'error', 3000);
      return null;
    }
    
    addToast('Requesting signature in wallet...', 'info', 1500);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    
    // Generate a mock signature
    const sigChars = '0123456789abcdef';
    let sig = '0x';
    for (let i = 0; i < 130; i++) {
      sig += sigChars[Math.floor(Math.random() * sigChars.length)];
    }
    addToast('Message signed successfully', 'success', 2500);
    return sig;
  }, [wallet.connected, wallet.address, addToast]);

  return (
    <WalletContext.Provider
      value={{
        wallet,
        connectWallet,
        disconnectWallet,
        switchNetwork,
        signMessageSimulated,
        isConnecting,
        activeProvider,
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
