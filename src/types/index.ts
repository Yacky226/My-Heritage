export interface User {
  name: string;
  email: string;
  avatar: string;
  address?: string;
  backupPhraseSeed?: string;
}

export interface VaultFile {
  name: string;
  size: string;
  type: string;
  bytes?: number;
  source?: File;
}

export type VaultStatus = 'Active' | 'Locked' | 'Claimed';

export interface Vault {
  id: string;
  owner?: string;
  name: string;
  heir: string;
  status: VaultStatus;
  ipfsCid?: string;
  lastPing: string; // Readable text like "2 days ago"
  lastPingTimestamp: number; // UNIX timestamp
  unlockTimestamp?: number; // UNIX timestamp in ms
  inactivityDelaySeconds?: number;
  inactivityTimer: string; // e.g. "90 days"
  inactivityDays: number; // e.g. 90
  isClaimable?: boolean;
  revoked?: boolean;
  claimed?: boolean;
  locked?: boolean;
  createdAt: string;
  fileCount: number;
  fileSize: string;
  description?: string;
  files?: VaultFile[];
}

export type ActivityType =
  | 'VaultCreated'
  | 'PingExecuted'
  | 'VaultClaimed'
  | 'VaultRevoked'
  | 'VaultHeirUpdated'
  | 'VaultCidUpdated'
  | 'VaultLocked'
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
  txFrom?: string;
  vaultId?: string;
  relatedAddresses?: string[];
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
  canClaim?: boolean;
  lastPingTimestamp: number;
  inactivityDays: number;
  unlockTimestamp?: number;
  cooldownTimeRemaining?: number; // in seconds
  fileCount: number;
  fileSize: string;
  description?: string;
  files?: Array<{ name: string; size: string }>;
}

export interface WalletState {
  connected: boolean;
  address: string | null;
  provider: string | null;
  network: string;
}
