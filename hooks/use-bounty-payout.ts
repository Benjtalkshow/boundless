import { useEffect, useRef, useState } from 'react';
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

export interface BountyPayoutResponse {
  txHash: string | null;
}

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

  const [hasStarted, setHasStarted] = useState(false);
  const [payoutResponse, setPayoutResponse] =
    useState<BountyPayoutResponse | null>(null);
  const finalizedRef = useRef(false);

  useEffect(() => {
    if (!hasStarted || finalizedRef.current) return;

    if (runner.isCompleted) {
      finalizedRef.current = true;
      setPayoutResponse({ txHash: runner.txHash });
      toast.success('Winners paid out!', { duration: 3000 });
      setHasStarted(false);
    } else if (runner.isFailed) {
      finalizedRef.current = true;
      toast.error(runner.error || 'Failed to pay out winners');
      setHasStarted(false);
    }
  }, [
    hasStarted,
    runner.isCompleted,
    runner.isFailed,
    runner.error,
    runner.txHash,
  ]);

  const selectWinners = async (
    selections: BountyWinnerSelection[]
  ): Promise<void> => {
    if (!organizationId || !bountyId) return;
    if (!ownerAddress) {
      toast.error(
        isExternal
          ? 'Connect a wallet to sign the payout.'
          : 'Please connect your wallet first'
      );
      return;
    }
    if (selections.length === 0) {
      toast.error('Assign at least one winner before paying out.');
      return;
    }

    const body: SelectBountyWinnersRequest = {
      ownerAddress,
      selections,
      fundingMode,
    };

    finalizedRef.current = false;
    setHasStarted(true);
    setPayoutResponse(null);
    toast.info('Submitting winner selection…');

    await runner.run(() => selectMutation.mutateAsync(body));
  };

  return {
    selectWinners,
    payoutResponse,
    phase: runner.phase,
    isRunning: runner.isRunning,
    isCompleted: runner.isCompleted,
    isFailed: runner.isFailed,
    txHash: runner.txHash,
    error: runner.error,
    reset: runner.reset,
  };
};
