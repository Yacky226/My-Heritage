import { useReadContract } from 'wagmi';
import LearningVaultArtifact from '../contracts/LearningVault.json';
import { LEARNING_VAULT_ADDRESS } from '../contracts/address';

const learningVaultAbi = LearningVaultArtifact.abi;

export function useLearningVault() {
  const ownerQuery = useReadContract({
    address: LEARNING_VAULT_ADDRESS,
    abi: learningVaultAbi,
    functionName: 'owner',
  });

  const heirQuery = useReadContract({
    address: LEARNING_VAULT_ADDRESS,
    abi: learningVaultAbi,
    functionName: 'heir',
  });

  const ipfsCidQuery = useReadContract({
    address: LEARNING_VAULT_ADDRESS,
    abi: learningVaultAbi,
    functionName: 'ipfsCid',
  });

  return {
    owner: ownerQuery.data as string | undefined,
    heir: heirQuery.data as string | undefined,
    ipfsCid: ipfsCidQuery.data as string | undefined,

    isLoading:
      ownerQuery.isLoading ||
      heirQuery.isLoading ||
      ipfsCidQuery.isLoading,

    error:
      ownerQuery.error ||
      heirQuery.error ||
      ipfsCidQuery.error,

    refetch: () => {
      ownerQuery.refetch();
      heirQuery.refetch();
      ipfsCidQuery.refetch();
    },
  };
}