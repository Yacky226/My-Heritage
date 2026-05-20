import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Vault, Activity, ActivityType } from '../types';
import { useToast } from './useToast';
import { useWallet } from './useWallet';
import { generateTxHash } from '../utils/format';

interface VaultsContextProps {
  vaults: Vault[];
  activities: Activity[];
  createVault: (name: string, heir: string, inactivityDays: number, description: string, files: Array<{ name: string; size: string; type: string }>) => Promise<boolean>;
  pingVault: (id: string) => Promise<boolean>;
  deleteVault: (id: string) => void;
  updateVaultTimer: (id: string, days: number) => void;
  updateVaultHeir: (id: string, heir: string) => void;
  addActivity: (type: ActivityType, desc: string) => void;
  isLoading: boolean;
}

const VaultsContext = createContext<VaultsContextProps | undefined>(undefined);

// Initial mock data
const defaultVaults: Vault[] = [
  {
    id: 'vault-1',
    name: 'Family Seed Phrases',
    heir: '0x5e8F1aC8F7E41C7771746B316D7f8b9A2b3c10D9',
    status: 'Active',
    lastPing: '2 days ago',
    lastPingTimestamp: Date.now() - 2 * 24 * 3600 * 1000,
    inactivityTimer: '90 days',
    inactivityDays: 90,
    createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toLocaleDateString(),
    fileCount: 4,
    fileSize: '1.2 MB',
    description: 'Contains MetaMask recovery seeds, cold wallet seed sheets, and digital asset allocation plans.',
    files: [
      { name: 'ledger_seed.txt', size: '1.2 KB', type: 'text/plain' },
      { name: 'metamask_phrase.pdf', size: '245 KB', type: 'application/pdf' },
      { name: 'allocation_matrix.xlsx', size: '920 KB', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
    ]
  },
  {
    id: 'vault-2',
    name: 'Passport & Will Draft',
    heir: '0x9d164F1AC4d41C7f71B36D8b92b3c10D9A2A38FC',
    status: 'Active',
    lastPing: '5 hours ago',
    lastPingTimestamp: Date.now() - 5 * 3600 * 1000,
    inactivityTimer: '180 days',
    inactivityDays: 180,
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toLocaleDateString(),
    fileCount: 2,
    fileSize: '4.8 MB',
    description: 'Scans of official passports, birth certificates, and the initial draft of the digital inheritance will.',
    files: [
      { name: 'will_draft_v2.pdf', size: '1.8 MB', type: 'application/pdf' },
      { name: 'passport_scan.jpg', size: '3.0 MB', type: 'image/jpeg' }
    ]
  },
  {
    id: 'vault-3',
    name: 'Crypto Keys & API Credentials',
    heir: '0x71C6793Bfc6F0b7b1348EF853a479B4Cd0C09A23',
    status: 'Active',
    lastPing: '89 days ago',
    // Almost expired (limit is 90 days, let's make it expire in 30 seconds for visual test!)
    lastPingTimestamp: Date.now() - 90 * 24 * 3600 * 1000 + 30000,
    inactivityTimer: '90 days',
    inactivityDays: 90,
    createdAt: new Date(Date.now() - 95 * 24 * 3600 * 1000).toLocaleDateString(),
    fileCount: 1,
    fileSize: '150 KB',
    description: 'Sub-keys for trading accounts and server ssh credentials.',
    files: [
      { name: 'server_credentials.pem', size: '150 KB', type: 'application/x-x509-ca-cert' }
    ]
  }
];

const defaultActivities: Activity[] = [
  {
    id: 'act-1',
    type: 'VaultCreated',
    desc: 'Created vault "Family Seed Phrases"',
    date: '2 mins ago',
    hash: '0x8a2f47c3e109d94816be5104d49aef6542616f73117462a71f8b4d9a3b821bc4',
    block: 19482103,
    gasUsed: '0.0042 ETH',
    status: 'Success'
  },
  {
    id: 'act-2',
    type: 'PingExecuted',
    desc: 'Proof of Life verified for "Passport & Will Draft"',
    date: '5 hours ago',
    hash: '0x1b2d49c6b8c9d16a5b82dfc437198e3b1c2a0d9b4c718b52f9e421cd673a5a7b',
    block: 19481820,
    gasUsed: '0.0018 ETH',
    status: 'Success'
  },
  {
    id: 'act-3',
    type: 'HeirAssigned',
    desc: 'Added heir 0x5e8F...c10D9 to "Family Seed Phrases"',
    date: '3 days ago',
    hash: '0x5e6d7d8a9b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e',
    block: 19472183,
    gasUsed: '0.0028 ETH',
    status: 'Success'
  }
];

export function VaultsProvider({ children }: { children: ReactNode }) {
  const { addToast } = useToast();
  const { signMessageSimulated } = useWallet();
  const [isLoading, setIsLoading] = useState(false);

  const [vaults, setVaults] = useState<Vault[]>(() => {
    const saved = localStorage.getItem('aegis_vaults');
    return saved ? JSON.parse(saved) : defaultVaults;
  });

  const [activities, setActivities] = useState<Activity[]>(() => {
    const saved = localStorage.getItem('aegis_activities');
    return saved ? JSON.parse(saved) : defaultActivities;
  });

  useEffect(() => {
    localStorage.setItem('aegis_vaults', JSON.stringify(vaults));
  }, [vaults]);

  useEffect(() => {
    localStorage.setItem('aegis_activities', JSON.stringify(activities));
  }, [activities]);

  // Tick the countdown timers every second
  useEffect(() => {
    const interval = setInterval(() => {
      setVaults((prevVaults) => {
        let changed = false;
        const nextVaults = prevVaults.map((vault) => {
          if (vault.status !== 'Active') return vault;
          
          const maxInactivityMs = vault.inactivityDays * 24 * 3600 * 1000;
          const timeElapsed = Date.now() - vault.lastPingTimestamp;
          const timeRemaining = maxInactivityMs - timeElapsed;

          if (timeRemaining <= 0) {
            changed = true;
            // Lock the vault
            addToast(`Vault "${vault.name}" timer expired! Status set to LOCKED.`, 'error', 5000);
            return {
              ...vault,
              status: 'Locked' as const
            };
          }
          return vault;
        });

        return changed ? nextVaults : prevVaults;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [addToast]);

  const addActivity = useCallback((type: ActivityType, desc: string) => {
    const newActivity: Activity = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      desc,
      date: 'Just now',
      hash: generateTxHash(),
      block: 19483000 + Math.floor(Math.random() * 500),
      gasUsed: (0.0015 + Math.random() * 0.0035).toFixed(4) + ' ETH',
      status: 'Success'
    };
    setActivities((prev) => [newActivity, ...prev]);
  }, []);

  const createVault = useCallback(async (
    name: string,
    heir: string,
    inactivityDays: number,
    description: string,
    files: Array<{ name: string; size: string; type: string }>
  ): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate smart contract setup
    const sig = await signMessageSimulated(`Authorize Aegis Protocol smart contract deployment for: ${name}`);
    if (!sig) {
      setIsLoading(false);
      return false;
    }

    addToast('Broadcasting smart contract transaction to network...', 'info', 1500);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const totalBytes = files.reduce((acc, curr) => {
      const sizeVal = parseFloat(curr.size);
      const isMB = curr.size.includes('MB');
      return acc + (sizeVal * (isMB ? 1024 * 1024 : 1024));
    }, 0);

    const sizeStr = totalBytes > 1024 * 1024 
      ? (totalBytes / (1024 * 1024)).toFixed(1) + ' MB'
      : (totalBytes / 1024).toFixed(1) + ' KB';

    const newVault: Vault = {
      id: `vault-${Math.random().toString(36).substring(2, 9)}`,
      name,
      heir,
      status: 'Active',
      lastPing: 'Just now',
      lastPingTimestamp: Date.now(),
      inactivityTimer: `${inactivityDays} days`,
      inactivityDays,
      createdAt: new Date().toLocaleDateString(),
      fileCount: files.length || 1,
      fileSize: sizeStr || '0 KB',
      description,
      files: files.length > 0 ? files : [{ name: 'secured_package.zip', size: '1.2 MB', type: 'application/zip' }]
    };

    setVaults((prev) => [newVault, ...prev]);
    addActivity('VaultCreated', `Created vault "${name}" with heir ${heir.slice(0, 6)}...${heir.slice(-4)}`);
    
    setIsLoading(false);
    addToast('Digital Vault successfully deployed on-chain!', 'success', 3000);
    return true;
  }, [signMessageSimulated, addToast, addActivity]);

  const pingVault = useCallback(async (id: string): Promise<boolean> => {
    const vault = vaults.find((v) => v.id === id);
    if (!vault) return false;

    setIsLoading(true);
    const sig = await signMessageSimulated(`Submit Proof of Life signature for vault: ${vault.name}`);
    if (!sig) {
      setIsLoading(false);
      return false;
    }

    addToast('Broadcasting Proof of Life transaction...', 'info', 1500);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setVaults((prevVaults) =>
      prevVaults.map((v) =>
        v.id === id
          ? {
              ...v,
              status: 'Active',
              lastPing: 'Just now',
              lastPingTimestamp: Date.now()
            }
          : v
      )
    );

    addActivity('PingExecuted', `Proof of Life heartbeat verified for "${vault.name}"`);
    setIsLoading(false);
    addToast('Vault timer reset to full duration!', 'success', 3000);
    return true;
  }, [vaults, signMessageSimulated, addToast, addActivity]);

  const deleteVault = useCallback((id: string) => {
    const vault = vaults.find((v) => v.id === id);
    if (!vault) return;

    setVaults((prev) => prev.filter((v) => v.id !== id));
    addToast(`Vault "${vault.name}" has been deleted.`, 'info', 3000);
  }, [vaults, addToast]);

  const updateVaultTimer = useCallback((id: string, days: number) => {
    setVaults((prevVaults) =>
      prevVaults.map((v) =>
        v.id === id
          ? {
              ...v,
              inactivityDays: days,
              inactivityTimer: `${days} days`
            }
          : v
      )
    );
    addToast('Timer threshold successfully updated', 'success', 2500);
  }, [addToast]);

  const updateVaultHeir = useCallback((id: string, heir: string) => {
    setVaults((prevVaults) =>
      prevVaults.map((v) =>
        v.id === id
          ? {
              ...v,
              heir
            }
          : v
      )
    );
    addToast('Heir assignment updated successfully', 'success', 2500);
    addActivity('HeirAssigned', `Updated heir for vault config to ${heir.slice(0, 6)}...${heir.slice(-4)}`);
  }, [addToast, addActivity]);

  return (
    <VaultsContext.Provider
      value={{
        vaults,
        activities,
        createVault,
        pingVault,
        deleteVault,
        updateVaultTimer,
        updateVaultHeir,
        addActivity,
        isLoading
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
