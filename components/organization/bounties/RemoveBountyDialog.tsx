'use client';

import { AlertTriangle, Archive } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

/** completed / cancelled bounties can be archived; live ones must be cancelled. */
const TERMINAL_STATUSES = new Set(['completed', 'cancelled']);

interface RemoveBountyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bountyTitle: string;
  /** Lowercase lifecycle status of the bounty being removed. */
  status: string;
  isArchiving?: boolean;
  /** Archive (soft-delete) a closed-out bounty. */
  onArchive: () => void;
  /** Route to the settings close-out (cancel + refund) for a live bounty. */
  onCancelRefund: () => void;
}

/**
 * Confirmation modal for removing a published bounty, mirroring the hackathon
 * delete dialog. A funded bounty can't be hard-deleted: once completed or
 * cancelled it is archived (recoverable, never deleted); while still live it
 * must be cancelled and refunded on-chain, so we route there instead.
 */
export default function RemoveBountyDialog({
  open,
  onOpenChange,
  bountyTitle,
  status,
  isArchiving = false,
  onArchive,
  onCancelRefund,
}: RemoveBountyDialogProps) {
  const isTerminal = TERMINAL_STATUSES.has(status);
  const title = bountyTitle || 'this bounty';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className='border-zinc-800 bg-zinc-950'>
        <AlertDialogHeader className='items-center'>
          <div className='flex size-12 items-center justify-center rounded-full bg-red-500/10'>
            {isTerminal ? (
              <Archive className='size-6 text-red-500' />
            ) : (
              <AlertTriangle className='size-6 text-red-500' />
            )}
          </div>
          <AlertDialogTitle className='text-xl text-white'>
            {isTerminal ? 'Archive this bounty?' : 'This bounty is still live'}
          </AlertDialogTitle>
          <AlertDialogDescription className='text-center text-zinc-400'>
            {isTerminal ? (
              <>
                <span className='font-semibold text-white'>
                  &quot;{title}&quot;
                </span>{' '}
                will be hidden from your active list. Its records are never
                deleted, and you can restore it anytime.
              </>
            ) : (
              <>
                <span className='font-semibold text-white'>
                  &quot;{title}&quot;
                </span>{' '}
                is funded on-chain and can&apos;t be deleted. To remove it,
                cancel and refund it first.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isArchiving}
            className='border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white'
          >
            {isTerminal ? 'Cancel' : 'Not now'}
          </AlertDialogCancel>
          {isTerminal ? (
            <AlertDialogAction
              onClick={onArchive}
              disabled={isArchiving}
              className='bg-red-500 text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50'
            >
              {isArchiving ? 'Archiving...' : 'Archive bounty'}
            </AlertDialogAction>
          ) : (
            <AlertDialogAction
              onClick={onCancelRefund}
              className='bg-red-500 text-white hover:bg-red-600'
            >
              Cancel &amp; refund
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
