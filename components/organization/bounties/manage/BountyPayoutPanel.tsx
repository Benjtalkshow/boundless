'use client';

import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  EyeOff,
  Loader2,
  Trophy,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BoundlessButton } from '@/components/buttons';
import EmptyState from '@/components/EmptyState';
import { DueCountdown } from '@/components/bounties/DueCountdown';
import {
  useBountySubmissions,
  type BountyOperateOverview,
  type BountyWinnerSelection,
  type OrganizerBountySubmission,
} from '@/features/bounties';
import { useBountyPayout } from '@/hooks/use-bounty-payout';

const PHASE_LABEL: Record<string, string> = {
  starting: 'Preparing payout…',
  signing: 'Signing…',
  submitting: 'Submitting…',
  polling: 'Paying winners on-chain…',
};

const NONE = '__none__';

export default function BountyPayoutPanel({
  organizationId,
  bountyId,
  overview,
}: {
  organizationId: string;
  bountyId: string;
  overview: BountyOperateOverview;
}) {
  const isCompleted = overview.status === 'completed';
  const deadlinePassed = overview.submissionDeadline
    ? new Date(overview.submissionDeadline).getTime() <= Date.now()
    : false;
  const gated =
    overview.submissionVisibility === 'HIDDEN_UNTIL_DEADLINE' &&
    !deadlinePassed;

  const { data, isLoading } = useBountySubmissions(organizationId, bountyId, {
    enabled: !gated,
  });
  const submissions = useMemo(() => data?.items ?? [], [data]);

  const payout = useBountyPayout({ organizationId, bountyId });

  // position -> submissionId
  const [assignments, setAssignments] = useState<Record<number, string>>({});

  const prizeTiers = useMemo(
    () => overview.prizeTiers.slice().sort((a, b) => a.position - b.position),
    [overview.prizeTiers]
  );

  // Only anchored (non-withdrawn) submissions can be paid.
  const eligible = useMemo(
    () => submissions.filter(s => s.escrowAnchorStatus === 'active'),
    [submissions]
  );

  const selections: BountyWinnerSelection[] = useMemo(() => {
    const out: BountyWinnerSelection[] = [];
    for (const tier of prizeTiers) {
      const subId = assignments[tier.position];
      const sub = eligible.find(s => s.id === subId);
      if (sub?.applicantAddress) {
        out.push({
          applicantAddress: sub.applicantAddress,
          position: tier.position,
        });
      }
    }
    return out;
  }, [assignments, prizeTiers, eligible]);

  const totalPayout = useMemo(
    () =>
      prizeTiers
        .filter(t => assignments[t.position])
        .reduce((sum, t) => sum + Number(t.amount), 0),
    [assignments, prizeTiers]
  );

  // ── Completed: show the winners the backend recorded ──
  if (isCompleted) {
    const winners = submissions
      .filter(s => s.tierPosition != null)
      .sort((a, b) => (a.tierPosition as number) - (b.tierPosition as number));
    return (
      <div className='space-y-4'>
        <div className='flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3'>
          <CheckCircle2 className='h-5 w-5 text-emerald-400' />
          <div>
            <p className='text-sm font-medium text-white'>Paid out</p>
            <p className='text-xs text-zinc-400'>
              This bounty is completed and rewards were pushed on-chain.
            </p>
          </div>
        </div>
        {winners.length === 0 ? (
          <EmptyState
            title='No winner records'
            description='This bounty completed without recorded winners.'
            type='compact'
          />
        ) : (
          winners.map(w => (
            <WinnerRow key={w.id} s={w} currency={overview.rewardCurrency} />
          ))
        )}
      </div>
    );
  }

  if (gated) {
    return (
      <div className='rounded-2xl border border-zinc-800 bg-zinc-900/40 py-16 text-center'>
        <EyeOff className='mx-auto mb-3 h-6 w-6 text-zinc-500' />
        <p className='text-sm font-medium text-zinc-200'>
          Winner selection opens at the deadline
        </p>
        <p className='mt-1 text-xs text-zinc-500'>
          Competition submissions stay sealed until then.
        </p>
        {overview.submissionDeadline && (
          <div className='mt-3 flex justify-center'>
            <DueCountdown
              deadline={overview.submissionDeadline}
              className='flex items-center gap-1.5 text-xs font-medium text-zinc-300'
            />
          </div>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-16'>
        <Loader2 className='h-5 w-5 animate-spin text-zinc-500' />
      </div>
    );
  }

  if (prizeTiers.length === 0) {
    return (
      <EmptyState
        title='No prize tiers'
        description='This bounty has no prize tiers to award.'
        type='compact'
      />
    );
  }

  if (eligible.length === 0) {
    return (
      <EmptyState
        title='No eligible submissions'
        description='Winners are chosen from anchored submissions. None are available yet.'
        type='compact'
      />
    );
  }

  const setWinner = (position: number, submissionId: string) =>
    setAssignments(prev => {
      const next = { ...prev };
      if (submissionId === NONE) delete next[position];
      else next[position] = submissionId;
      return next;
    });

  const running = payout.isRunning;

  return (
    <div className='space-y-5'>
      <p className='text-sm text-zinc-400'>
        Assign a submission to each prize tier, then pay out in one signed
        transaction. On settle the bounty completes and rewards go on-chain.
      </p>

      <div className='space-y-3'>
        {prizeTiers.map(tier => {
          const assignedElsewhere = new Set(
            Object.entries(assignments)
              .filter(([pos]) => Number(pos) !== tier.position)
              .map(([, id]) => id)
          );
          const options = eligible.filter(s => !assignedElsewhere.has(s.id));
          return (
            <div
              key={tier.position}
              className='flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4'
            >
              <div className='flex items-center gap-2'>
                <Trophy className='text-primary h-4 w-4' />
                <div>
                  <p className='text-sm font-medium text-white'>
                    {ordinal(tier.position)} place
                  </p>
                  <p className='text-primary text-xs font-semibold'>
                    {Number(tier.amount).toLocaleString()}{' '}
                    {overview.rewardCurrency}
                  </p>
                </div>
              </div>
              <div className='flex-1'>
                <Select
                  value={assignments[tier.position] ?? NONE}
                  onValueChange={v => setWinner(tier.position, v)}
                  disabled={running}
                >
                  <SelectTrigger className='border-zinc-800 bg-zinc-900/50 text-white'>
                    <SelectValue placeholder='Choose a winner' />
                  </SelectTrigger>
                  <SelectContent className='border-zinc-800 bg-zinc-900 text-white'>
                    <SelectItem value={NONE}>No winner</SelectItem>
                    {options.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.submittedBy.name}
                        {s.submittedBy.username
                          ? ` (@${s.submittedBy.username})`
                          : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          );
        })}
      </div>

      {payout.isCompleted ? (
        <div className='space-y-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4'>
          <div className='flex items-center gap-2 text-sm text-white'>
            <CheckCircle2 className='h-4 w-4 text-emerald-400' />
            Winners paid out. The bounty is now completed.
          </div>
          {payout.txHash && (
            <a
              href={`https://stellar.expert/explorer/testnet/tx/${payout.txHash}`}
              target='_blank'
              rel='noreferrer'
              className='text-primary inline-flex items-center gap-1 text-xs hover:underline'
            >
              View payout transaction
              <ExternalLink className='h-3 w-3' />
            </a>
          )}
        </div>
      ) : running ? (
        <div className='flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-sm text-zinc-300'>
          <Loader2 className='text-primary h-4 w-4 animate-spin' />
          {PHASE_LABEL[payout.phase] || 'Working…'}
        </div>
      ) : (
        <div className='flex items-center justify-between gap-3 border-t border-zinc-800 pt-4'>
          <span className='text-sm text-zinc-400'>
            {selections.length > 0
              ? `Paying ${totalPayout.toLocaleString()} ${overview.rewardCurrency} to ${selections.length} winner${selections.length > 1 ? 's' : ''}`
              : 'Assign at least one winner'}
          </span>
          <BoundlessButton
            disabled={selections.length === 0}
            onClick={() => void payout.selectWinners(selections)}
          >
            Select winners &amp; pay
          </BoundlessButton>
        </div>
      )}
    </div>
  );
}

function WinnerRow({
  s,
  currency,
}: {
  s: OrganizerBountySubmission;
  currency: string;
}) {
  const user = s.submittedBy;
  return (
    <div className='flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4'>
      <div className='flex items-center gap-2.5'>
        <Avatar className='h-8 w-8'>
          <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name} />
          <AvatarFallback className='text-xs'>
            {user.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className='text-sm font-medium text-white'>{user.name}</p>
          <p className='text-xs text-zinc-500'>
            {ordinal(s.tierPosition as number)} place
          </p>
        </div>
      </div>
      <span className='text-primary text-sm font-semibold'>
        {s.tierAmount
          ? `${Number(s.tierAmount).toLocaleString()} ${currency}`
          : ''}
      </span>
    </div>
  );
}

const ordinal = (n: number): string => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
};
