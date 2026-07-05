'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, ExternalLink, Loader2, Megaphone } from 'lucide-react';

import { Textarea } from '@/components/ui/textarea';
import { BoundlessButton } from '@/components/buttons';
import EmptyState from '@/components/EmptyState';
import {
  useBountyAnnouncement,
  useBountyResults,
  usePublishBountyResults,
  type BountyOperateOverview,
  type BountyResultsWinner,
} from '@/features/bounties';
import { formatPublicKey, ordinal } from '@/lib/utils';
import { getTransactionExplorerUrl } from '@/lib/wallet-utils';

/** Token amounts arrive as decimal strings; show full Stellar precision. */
function formatAmount(amount: string | number): string {
  const n = Number(amount);
  return Number.isFinite(n)
    ? n.toLocaleString(undefined, { maximumFractionDigits: 7 })
    : String(amount);
}

const MAX_MESSAGE = 2000;

export default function BountyResultsPanel({
  organizationId,
  bountyId,
  overview,
}: {
  organizationId: string;
  bountyId: string;
  overview: BountyOperateOverview;
}) {
  const isCompleted = overview.status === 'completed';

  const { data: results, isLoading: resultsLoading } = useBountyResults(
    bountyId,
    { enabled: isCompleted }
  );
  const { data: announcement, isLoading: announcementLoading } =
    useBountyAnnouncement(bountyId, { enabled: isCompleted });
  const publish = usePublishBountyResults(organizationId, bountyId);

  const [message, setMessage] = useState('');

  if (!isCompleted) {
    return (
      <EmptyState
        title='Results not ready'
        description='Publish the winner announcement once the bounty is completed and paid out.'
        type='compact'
      />
    );
  }

  if (resultsLoading || announcementLoading) {
    return (
      <div className='flex items-center justify-center py-16'>
        <Loader2 className='h-5 w-5 animate-spin text-zinc-500' />
      </div>
    );
  }

  const winners = (results?.winners ?? [])
    .slice()
    .sort((a, b) => a.tierPosition - b.tierPosition);

  const onPublish = () => {
    const trimmed = message.trim();
    if (!trimmed) {
      toast.error('Write an announcement message first.');
      return;
    }
    publish.mutate(
      { message: trimmed },
      {
        onSuccess: () => {
          toast.success('Winners announced.');
          setMessage('');
        },
        onError: err =>
          toast.error(
            err instanceof Error ? err.message : 'Failed to publish results'
          ),
      }
    );
  };

  return (
    <div className='space-y-6'>
      {/* Winners */}
      <section className='space-y-3'>
        <h3 className='text-sm font-semibold text-white'>Winners</h3>
        {winners.length === 0 ? (
          <EmptyState
            title='No winners recorded'
            description='This bounty completed without recorded winners.'
            type='compact'
          />
        ) : (
          <div className='space-y-2'>
            {winners.map(w => (
              <WinnerRow
                key={w.submissionId}
                winner={w}
                currency={results?.rewardCurrency ?? overview.rewardCurrency}
              />
            ))}
          </div>
        )}
      </section>

      {/* Announcement */}
      <section className='space-y-3 border-t border-zinc-800 pt-6'>
        <div className='flex items-center gap-2'>
          <Megaphone className='h-4 w-4 text-zinc-400' />
          <h3 className='text-sm font-semibold text-white'>
            Winner announcement
          </h3>
        </div>

        {announcement ? (
          <div className='space-y-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] p-4'>
            <div className='flex items-center gap-2 text-sm text-white'>
              <CheckCircle2 className='h-4 w-4 text-emerald-400' />
              Published
            </div>
            <p className='text-sm whitespace-pre-wrap text-zinc-300'>
              {announcement.message}
            </p>
          </div>
        ) : (
          <div className='space-y-3'>
            <p className='text-sm text-zinc-400'>
              Publish a message to announce the winners. It notifies the winners
              and the community, and appears on the public results page.
            </p>
            <Textarea
              value={message}
              onChange={e => setMessage(e.target.value.slice(0, MAX_MESSAGE))}
              placeholder='Congratulations to our winners…'
              rows={5}
              disabled={publish.isPending}
              className='border-zinc-800 bg-zinc-900/50 text-white placeholder:text-zinc-600'
            />
            <div className='flex items-center justify-between'>
              <span className='text-xs text-zinc-600'>
                {message.length}/{MAX_MESSAGE}
              </span>
              <BoundlessButton
                onClick={onPublish}
                disabled={publish.isPending || !message.trim()}
              >
                {publish.isPending ? (
                  <>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    Publishing…
                  </>
                ) : (
                  'Publish & announce'
                )}
              </BoundlessButton>
            </div>
          </div>
        )}
      </section>
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
    <div className='flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4'>
      <div className='min-w-0'>
        <p className='text-sm font-medium text-white'>
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
