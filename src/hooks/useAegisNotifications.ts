import { useEffect, useMemo, useState } from 'react';
import { useClaims } from './useClaims';
import { useVaults } from './useVaults';
import { useWallet } from './useWallet';
import { formatTimeRemaining, sliceAddress } from '../utils/format';
import type { ActivityType } from '../types';

export type AegisNotification = {
  id: string;
  title: string;
  desc: string;
  time: string;
  urgent: boolean;
  targetPage: 'vaults' | 'heir' | 'activity' | 'security' | 'dashboard';
};

function eventTitle(type: ActivityType) {
  switch (type) {
    case 'VaultCreated':
      return 'Vault created';
    case 'PingExecuted':
      return 'Proof of life recorded';
    case 'VaultClaimed':
      return 'Vault claimed';
    case 'VaultRevoked':
      return 'Vault revoked';
    case 'VaultHeirUpdated':
      return 'Heir updated';
    case 'VaultCidUpdated':
      return 'IPFS payload updated';
    case 'VaultLocked':
      return 'Vault locked';
    default:
      return 'Protocol activity';
  }
}

function getNotificationPreferenceKey(address?: string | null) {
  return address
    ? `aegis:in-app-notifications-enabled:${address.toLowerCase()}`
    : 'aegis:in-app-notifications-enabled:disconnected';
}

function readInAppNotificationsEnabled(storageKey: string) {
  if (typeof window === 'undefined') return true;
  return window.localStorage.getItem(storageKey) !== 'false';
}

export function useAegisNotifications() {
  const { wallet } = useWallet();
  const { vaults, activities, isLoading: vaultsLoading } = useVaults();
  const { getInheritances, isLoading: claimsLoading } = useClaims();
  const [, setSettingsRevision] = useState(0);
  const inheritances = getInheritances();
  const notificationPreferenceKey = getNotificationPreferenceKey(wallet.address);
  const inAppNotificationsEnabled = readInAppNotificationsEnabled(notificationPreferenceKey);

  useEffect(() => {
    const refreshSettings = () => setSettingsRevision((value) => value + 1);
    window.addEventListener('aegis-settings-updated', refreshSettings);
    return () => window.removeEventListener('aegis-settings-updated', refreshSettings);
  }, []);

  const notifications = useMemo<AegisNotification[]>(() => {
    if (!inAppNotificationsEnabled) return [];

    const claimNotifications = inheritances
      .filter((claim) => claim.canClaim && !claim.revoked)
      .map((claim) => ({
        id: `claimable-${claim.vaultId}`,
        title: 'Inheritance ready to claim',
        desc: `Vault #${claim.vaultId} from ${sliceAddress(claim.owner)} can be claimed on-chain.`,
        time: 'Now',
        urgent: true,
        targetPage: 'heir' as const,
      }));

    const activeInheritanceNotifications = inheritances
      .filter((claim) => !claim.canClaim && !claim.revoked && claim.status !== 'Claimed')
      .slice(0, 2)
      .map((claim) => ({
        id: `assigned-${claim.vaultId}`,
        title: 'Inheritance assigned to you',
        desc: `Vault #${claim.vaultId} unlocks in ${formatTimeRemaining(claim.secondsUntilUnlock)}.`,
        time: 'Live',
        urgent: false,
        targetPage: 'heir' as const,
      }));

    const ownerExpiredNotifications = vaults
      .filter((vault) => vault.isClaimable && !vault.revoked && !vault.claimed)
      .map((vault) => ({
        id: `owner-expired-${vault.id}`,
        title: 'Owner vault reached unlock window',
        desc: `${vault.name} is claimable by ${sliceAddress(vault.heir)}. Send a ping if you are still active.`,
        time: 'Now',
        urgent: true,
        targetPage: 'vaults' as const,
      }));

    const recentActivityNotifications = activities
      .slice(0, 4)
      .map((activity) => ({
        id: `activity-${activity.id}`,
        title: eventTitle(activity.type),
        desc: activity.desc,
        time: activity.date,
        urgent: false,
        targetPage: 'activity' as const,
      }));

    const nextNotifications = [
      ...claimNotifications,
      ...ownerExpiredNotifications,
      ...activeInheritanceNotifications,
      ...recentActivityNotifications,
    ];

    const uniqueNotifications = new Map<string, AegisNotification>();
    nextNotifications.forEach((notification) => {
      uniqueNotifications.set(notification.id, notification);
    });

    return Array.from(uniqueNotifications.values()).slice(0, 8);
  }, [activities, inAppNotificationsEnabled, inheritances, vaults]);

  return {
    notifications,
    unreadCount: notifications.length,
    urgentCount: notifications.filter((notification) => notification.urgent).length,
    isLoading: vaultsLoading || claimsLoading,
  };
}
