'use client';

import { toast } from 'sonner';
import { CheckCircle2, Lock } from 'lucide-react';

import { BoundlessButton } from '@/components/buttons';
import { Badge } from '@/components/ui/badge';
import type { BountyPublic, MyBountyApplication } from '@/features/bounties';

/** Statuses where a bounty still accepts new entries. */
const ACCEPTING_STATUSES = new Set([
  'open',
  'open_for_applications',
  'upcoming',
]);

type EntryKind = 'claim' | 'join' | 'apply' | 'view';

function entryKind(b: BountyPublic): { kind: EntryKind; label: string } {
  const open = b.entryType === 'OPEN';
  const application =
    b.entryType === 'APPLICATION_LIGHT' || b.entryType === 'APPLICATION_FULL';
  if (open && b.claimType === 'SINGLE_CLAIM')
    return { kind: 'claim', label: 'Claim this bounty' };
  if (open && b.claimType === 'COMPETITION')
    return { kind: 'join', label: 'Join competition' };
  if (application) return { kind: 'apply', label: 'Apply' };
  return { kind: 'view', label: 'View' };
}

const STATUS_LABEL: Record<string, string> = {
  SUBMITTED: 'Application submitted',
  SHORTLISTED: 'Shortlisted',
  SELECTED: 'Selected',
  DECLINED: 'Not selected',
  WITHDRAWN: 'Withdrawn',
};

const STATUS_CLASS: Record<string, string> = {
  SUBMITTED: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
  SHORTLISTED: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  SELECTED: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  DECLINED: 'border-red-500/30 bg-red-500/10 text-red-400',
  WITHDRAWN: 'border-zinc-700 bg-zinc-800/60 text-zinc-300',
};

export function BountyEntryCta({
  bounty,
  myApplication,
}: {
  bounty: BountyPublic;
  myApplication: MyBountyApplication | null;
}) {
  const { label } = entryKind(bounty);

  const deadlinePassed =
    !!bounty.applicationWindowCloseAt &&
    new Date(bounty.applicationWindowCloseAt).getTime() < Date.now();
  const accepting = ACCEPTING_STATUSES.has(bounty.status);

  // An active (non-withdrawn) application means the caller is already in.
  const activeStatus =
    myApplication && myApplication.applicationStatus !== 'WITHDRAWN'
      ? myApplication.applicationStatus
      : null;

  // The real entry flow (forms / on-chain op) ships in #624; the CTA here is
  // mode-aware and correctly gated, and hands off to that flow.
  const onEntry = () =>
    toast.info('The entry flow is coming in the next step (apply/join/claim).');

  return (
    <div className='rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5'>
      {activeStatus ? (
        <div className='space-y-3'>
          <div className='flex items-center gap-2'>
            <CheckCircle2 className='text-primary h-4 w-4' />
            <span className='text-sm font-medium text-white'>
              You&apos;re in this bounty
            </span>
          </div>
          <Badge
            variant='outline'
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              STATUS_CLASS[activeStatus] ??
              'border-zinc-700 bg-zinc-800/60 text-zinc-300'
            }`}
          >
            {STATUS_LABEL[activeStatus] ?? activeStatus}
          </Badge>
        </div>
      ) : (
        <>
          <BoundlessButton
            size='lg'
            className='w-full'
            disabled={!accepting || deadlinePassed}
            onClick={onEntry}
          >
            {label}
          </BoundlessButton>
          <p className='mt-2 flex items-center justify-center gap-1.5 text-center text-xs text-zinc-500'>
            {!accepting ? (
              <>
                <Lock className='h-3.5 w-3.5' />
                This bounty is not accepting entries.
              </>
            ) : deadlinePassed ? (
              <>
                <Lock className='h-3.5 w-3.5' />
                Applications have closed.
              </>
            ) : myApplication?.applicationStatus === 'WITHDRAWN' ? (
              'You withdrew earlier — you can enter again.'
            ) : (
              'Funds are held in escrow and paid on-chain to winners.'
            )}
          </p>
        </>
      )}
    </div>
  );
}
