import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useWalletContext } from '@/components/providers/wallet-provider';
import { signXdrWithKit } from '@/lib/wallet/wallet-kit';
import {
  bountyKeys,
  useCancelBountyEscrow,
  useEscrowOpRunner,
  type CancelBountyEscrowRequest,
  type FundingMode,
} from '@/features/bounties';

interface UseBountyCancelProps {
  organizationId: string;
  bountyId: string;
  /** Signing path. Defaults to MANAGED (custodial). */
  fundingMode?: FundingMode;
  /** For EXTERNAL: the connected wallet that signs (owner of the escrow). */
  externalOwnerAddress?: string | null;
}

/**
 * Drives the single `cancel` op that aborts a published bounty and refunds the
 * escrow (contributors first, then the owner residual). Mirrors useBountyPayout:
 * MANAGED signs server-side (op comes back PENDING_CONFIRM), EXTERNAL returns an
 * unsigned XDR the connected wallet signs. On settle the backend subscriber
 * pushes the refunds and flips the bounty to CANCELLED; we invalidate the
 * overview so the dashboard reflects the new state immediately.
 */
export const useBountyCancel = ({
  organizationId,
  bountyId,
  fundingMode = 'MANAGED',
  externalOwnerAddress,
}: UseBountyCancelProps) => {
  const { walletAddress } = useWalletContext();
  const queryClient = useQueryClient();
  const isExternal = fundingMode === 'EXTERNAL';
  const ownerAddress = isExternal
    ? (externalOwnerAddress ?? null)
    : walletAddress;

  const cancelMutation = useCancelBountyEscrow(organizationId, bountyId);
  const runner = useEscrowOpRunner(
    { kind: 'organizer', organizationId, bountyId },
    isExternal ? { signXdr: signXdrWithKit } : undefined
  );

  // Toast each settle exactly once; the runner keeps its terminal flags set
  // after a run, so this ref is what arms the next run's notifications.
  const finalizedRef = useRef(false);

  useEffect(() => {
    if (finalizedRef.current) return;
    if (runner.isCompleted) {
      finalizedRef.current = true;
      toast.success('Bounty cancelled and escrow refunded.', {
        duration: 3000,
      });
      void queryClient.invalidateQueries({
        queryKey: bountyKeys.overview(organizationId, bountyId),
      });
    } else if (runner.isFailed) {
      finalizedRef.current = true;
      toast.error(runner.error || 'Failed to cancel the bounty');
    }
  }, [
    runner.isCompleted,
    runner.isFailed,
    runner.error,
    queryClient,
    organizationId,
    bountyId,
  ]);

  const cancel = async (): Promise<void> => {
    if (!organizationId || !bountyId) return;
    if (!ownerAddress) {
      toast.error(
        isExternal
          ? 'Connect a wallet to sign the cancellation.'
          : 'Please connect your wallet first'
      );
      return;
    }

    const body: CancelBountyEscrowRequest = {
      ownerAddress,
      fundingMode,
    };

    finalizedRef.current = false;
    toast.info('Submitting cancellation…');

    await runner.run(() => cancelMutation.mutateAsync(body));
  };

  return {
    cancel,
    phase: runner.phase,
    isRunning: runner.isRunning,
    isCompleted: runner.isCompleted,
    isFailed: runner.isFailed,
    txHash: runner.txHash,
    error: runner.error,
    reset: runner.reset,
  };
};
