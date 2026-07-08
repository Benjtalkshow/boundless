import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { useWalletContext } from '@/components/providers/wallet-provider';
import { signXdrWithKit } from '@/lib/wallet/wallet-kit';
import {
  useEscrowOpRunner,
  useSelectBountyWinners,
  type BountyWinnerSelection,
  type FundingMode,
  type SelectBountyWinnersRequest,
} from '@/features/bounties';

interface UseBountyPayoutProps {
  organizationId: string;
  bountyId: string;
  /** Signing path. Defaults to MANAGED (custodial). */
  fundingMode?: FundingMode;
  /** For EXTERNAL: the connected wallet that signs (owner of the escrow). */
  externalOwnerAddress?: string | null;
}

/**
 * Drives the single `select_winners` op that pays winners on-chain. Mirrors
 * useBountyPublish: MANAGED signs server-side (op comes back PENDING_CONFIRM),
 * EXTERNAL returns an unsigned XDR the connected wallet signs. On settle the
 * backend subscriber pushes USDC, marks winning submissions, and flips the
 * bounty to COMPLETED automatically.
 *
 * LIMITATION: `ownerAddress` must match the bounty's on-chain owner, but
 * SelectBountyWinnersDto has no `sourceWalletId`, so bounties published from
 * an org treasury wallet cannot be paid through this endpoint yet; the MANAGED
 * default only works for bounties funded from the caller's personal managed
 * wallet. The backend stores `escrowOwnerAddress` per bounty; resolving the
 * owner server-side (as the hackathon select-winners flow does) is tracked as
 * backend work.
 */
export const useBountyPayout = ({
  organizationId,
  bountyId,
  fundingMode = 'MANAGED',
  externalOwnerAddress,
}: UseBountyPayoutProps) => {
  const { walletAddress } = useWalletContext();
  const isExternal = fundingMode === 'EXTERNAL';
  const ownerAddress = isExternal
    ? (externalOwnerAddress ?? null)
    : walletAddress;

  const selectMutation = useSelectBountyWinners(organizationId, bountyId);
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
      toast.success('Winners paid out!', { duration: 3000 });
    } else if (runner.isFailed) {
      finalizedRef.current = true;
      toast.error(runner.error || 'Failed to pay out winners');
    }
  }, [runner.isCompleted, runner.isFailed, runner.error]);

  const selectWinners = async (
    selections: BountyWinnerSelection[]
  ): Promise<void> => {
    if (!organizationId || !bountyId || selections.length === 0) return;
    // EXTERNAL is signed by the connected wallet, so it's required there.
    // MANAGED is signed server-side by the on-chain event manager (the treasury
    // / owner that published) — no connected wallet needed. ownerAddress is a
    // hint only; the backend resolves and signs with the real manager.
    if (isExternal && !ownerAddress) {
      toast.error('Connect a wallet to sign the payout.');
      return;
    }

    // ownerAddress is optional; the backend resolves and signs with the
    // on-chain event manager. Send it only as a hint when we have it.
    const body: SelectBountyWinnersRequest = {
      selections,
      fundingMode,
      ...(ownerAddress ? { ownerAddress } : {}),
    };

    finalizedRef.current = false;
    toast.info('Submitting winner selection…');

    await runner.run(() => selectMutation.mutateAsync(body));
  };

  return {
    selectWinners,
    phase: runner.phase,
    isRunning: runner.isRunning,
    isCompleted: runner.isCompleted,
    isFailed: runner.isFailed,
    txHash: runner.txHash,
    error: runner.error,
    reset: runner.reset,
  };
};
