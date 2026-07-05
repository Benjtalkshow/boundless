'use client';

import { ExternalLink, Megaphone, Trophy } from 'lucide-react';

import {
  useBountyAnnouncement,
  useBountyResults,
  type BountyResultsWinner,
} from '@/features/bounties';
import { formatPublicKey, ordinal } from '@/lib/utils';
import { getTransactionExplorerUrl } from '@/lib/wallet-utils';

function formatAmount(amount: string | number): string {
  const n = Number(amount);
  return Number.isFinite(n)
    ? n.toLocaleString(undefined, { maximumFractionDigits: 7 })
    : String(amount);
}

/**
 * Public results block for a completed bounty: the winner announcement (if the
 * organizer published one) and winners by tier with their payout transaction.
 * Renders nothing until there is something to show.
 */
export function BountyResults({
  bountyId,
  currency,
}: {
  bountyId: string;
  currency: string;
}) {
  const { data: results } = useBountyResults(bountyId);
  const { data: announcement } = useBountyAnnouncement(bountyId);

  const winners = (results?.winners ?? [])
    .slice()
    .sort((a, b) => a.tierPosition - b.tierPosition);

  if (winners.length === 0 && !announcement) return null;

  return (
    <div className='mt-10'>
      <h2 className='mb-3 flex items-center gap-2 text-lg font-semibold text-white'>
        <Trophy className='text-primary h-5 w-5' />
        Results
      </h2>

      {announcement && (
        <div className='mb-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4'>
          <div className='mb-1.5 flex items-center gap-2 text-sm font-medium text-white'>
            <Megaphone className='h-4 w-4 text-zinc-400' />
            Announcement
          </div>
          <p className='text-sm whitespace-pre-wrap text-zinc-300'>
            {announcement.message}
          </p>
        </div>
      )}

      {winners.length > 0 && (
        <div className='space-y-2'>
          {winners.map(w => (
            <WinnerRow key={w.submissionId} winner={w} currency={currency} />
          ))}
        </div>
      )}
    </div>
  );
}

function WinnerRow({
  winner,
  currency,
}: {
  winner: BountyResultsWinner;
  currency: string;
}) {
  return (
    <div className='flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 px-4 py-3'>
      <div className='min-w-0'>
        <p className='text-sm font-medium text-zinc-300'>
          {ordinal(winner.tierPosition)} place
        </p>
        {winner.applicantAddress && (
          <p className='font-mono text-xs text-zinc-500'>
            {formatPublicKey(winner.applicantAddress)}
          </p>
        )}
      </div>
      <div className='text-right'>
        <p className='text-primary text-sm font-semibold'>
          {formatAmount(winner.tierAmount)} {currency}
        </p>
        {winner.rewardTransactionHash && (
          <a
            href={getTransactionExplorerUrl(winner.rewardTransactionHash)}
            target='_blank'
            rel='noreferrer'
            className='text-primary inline-flex items-center gap-1 text-xs hover:underline'
          >
            Payout tx
            <ExternalLink className='h-3 w-3' />
          </a>
        )}
      </div>
    </div>
  );
}
