export interface User {
  name: string;
  email: string;
  avatar: string;
  address?: string;
  backupPhraseSeed?: string;
}

export type VaultStatus = 'Active' | 'Locked' | 'Claimed';

export interface Vault {
  id: string;
  name: string;
  heir: string;
  status: VaultStatus;
  lastPing: string; // Readable text like "2 days ago"
  lastPingTimestamp: number; // UNIX timestamp
  inactivityTimer: string; // e.g. "90 days"
  inactivityDays: number; // e.g. 90
  createdAt: string;
  fileCount: number;
  fileSize: string;
  description?: string;
  files?: Array<{ name: string; size: string; type: string }>;
}

export type ActivityType =
  | 'VaultCreated'
  | 'PingExecuted'
  | 'HeirAssigned'
  | 'ClaimInitiated'
  | 'VaultDecrypted';

export interface Activity {
  id: string;
  type: ActivityType;
  desc: string;
  date: string;
  hash: string;
  block: number;
  gasUsed: string;
  status: 'Success' | 'Pending' | 'Failed';
}

export type ClaimStatus = 'Active' | 'Locked' | 'Cooldown' | 'Claimed';

export interface Claim {
  id: string;
  vaultId: string;
  vaultName: string;
  owner: string;
  heir: string;
  status: ClaimStatus;
  lastPingTimestamp: number;
  inactivityDays: number;
  cooldownTimeRemaining?: number; // in seconds
  fileCount: number;
  fileSize: string;
  files?: Array<{ name: string; size: string }>;
}

export interface WalletState {
  connected: boolean;
  address: string | null;
  provider: string | null;
  network: string;
}
