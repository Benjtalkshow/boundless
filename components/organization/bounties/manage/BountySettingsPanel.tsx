'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Loader2,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { BoundlessButton } from '@/components/buttons';
import {
  ESCROW_PHASE_LABEL,
  type BountyOperateOverview,
} from '@/features/bounties';
import { useBountyCancel } from '@/hooks/use-bounty-cancel';
import { getTransactionExplorerUrl } from '@/lib/wallet-utils';

const PHASE_LABEL = {
  ...ESCROW_PHASE_LABEL,
  starting: 'Preparing cancellation…',
  polling: 'Refunding escrow on-chain…',
};

/** Lifecycle statuses that mean the bounty can no longer be cancelled. */
const TERMINAL_STATUSES = new Set(['completed', 'cancelled']);

const CONFIRM_PHRASE = 'CANCEL';

export default function BountySettingsPanel({
  organizationId,
  bountyId,
  overview,
}: {
  organizationId: string;
  bountyId: string;
  overview: BountyOperateOverview;
}) {
  const cancelOp = useBountyCancel({ organizationId, bountyId });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const isCancelled = overview.status === 'cancelled';
  const isTerminal = TERMINAL_STATUSES.has(overview.status);
  // A draft has no on-chain escrow to refund; cancel only applies once funded.
  const isPublished = !!overview.escrowEventId;
  const running = cancelOp.isRunning;

  return (
    <div className='max-w-2xl space-y-6'>
      <div className='rounded-2xl border border-red-500/30 bg-red-500/[0.04] p-5'>
        <div className='flex items-start gap-3'>
          <AlertTriangle className='mt-0.5 h-5 w-5 shrink-0 text-red-400' />
          <div className='min-w-0 flex-1'>
            <h3 className='text-sm font-semibold text-white'>
              Cancel this bounty
            </h3>
            <p className='mt-1 text-sm text-zinc-400'>
              Cancelling closes the bounty and refunds the locked escrow.
              Contributors are refunded first, then any residual returns to you
              as the owner. This runs once on-chain and cannot be undone.
            </p>

            {cancelOp.isCompleted || isCancelled ? (
              <div className='mt-4 space-y-2 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4'>
                <div className='flex items-center gap-2 text-sm text-white'>
                  <CheckCircle2 className='h-4 w-4 text-emerald-400' />
                  This bounty is cancelled and the escrow was refunded.
                </div>
                {cancelOp.txHash && (
                  <a
                    href={getTransactionExplorerUrl(cancelOp.txHash)}
                    target='_blank'
                    rel='noreferrer'
                    className='text-primary inline-flex items-center gap-1 text-xs hover:underline'
                  >
                    View refund transaction
                    <ExternalLink className='h-3 w-3' />
                  </a>
                )}
              </div>
            ) : running ? (
              <div className='mt-4 flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-sm text-zinc-300'>
                <Loader2 className='text-primary h-4 w-4 animate-spin' />
                {PHASE_LABEL[cancelOp.phase] || 'Working…'}
              </div>
            ) : isTerminal ? (
              <p className='mt-4 text-sm text-zinc-500'>
                This bounty is {overview.status.replace(/_/g, ' ')} and can no
                longer be cancelled.
              </p>
            ) : !isPublished ? (
              <p className='mt-4 text-sm text-zinc-500'>
                This bounty is still a draft with no funded escrow. Delete it
                from your drafts instead.
              </p>
            ) : (
              <BoundlessButton
                variant='destructive'
                className='mt-4'
                onClick={() => {
                  setConfirmText('');
                  setConfirmOpen(true);
                }}
              >
                Cancel bounty &amp; refund
              </BoundlessButton>
            )}
          </div>
        </div>
      </div>

      {/* Explicit-confirm gate before the irreversible on-chain refund. */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className='border-zinc-800 bg-zinc-950 text-white'>
          <DialogHeader>
            <DialogTitle>Cancel this bounty?</DialogTitle>
            <DialogDescription>
              The escrow refunds in one on-chain transaction, contributors
              first, then your owner residual. This cannot be undone or
              reversed. Type{' '}
              <span className='font-mono font-semibold text-red-400'>
                {CONFIRM_PHRASE}
              </span>{' '}
              to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 text-sm'>
              <div className='flex items-center justify-between'>
                <span className='text-zinc-400'>Reward pool</span>
                <span className='font-semibold text-white'>
                  {overview.rewardAmount.toLocaleString()}{' '}
                  {overview.rewardCurrency}
                </span>
              </div>
            </div>
            <Input
              autoFocus
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder={`Type ${CONFIRM_PHRASE} to confirm`}
              className='border-zinc-800 bg-zinc-900/50 text-white placeholder:text-zinc-600'
            />
          </div>
          <DialogFooter>
            <BoundlessButton
              variant='outline'
              onClick={() => setConfirmOpen(false)}
            >
              Keep bounty
            </BoundlessButton>
            <BoundlessButton
              variant='destructive'
              disabled={confirmText.trim() !== CONFIRM_PHRASE}
              onClick={() => {
                setConfirmOpen(false);
                void cancelOp.cancel();
              }}
            >
              Cancel bounty &amp; refund
            </BoundlessButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
