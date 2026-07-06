'use client';

import { Calendar, Check, LineChart, TrendingUp } from 'lucide-react';

import { DueCountdown } from '@/components/bounties/DueCountdown';
import { ordinal } from '@/lib/utils';
import type { BountyOperateOverview } from '@/features/bounties';

/**
 * Overview = the bounty analytics dashboard, mirroring the hackathon organizer
 * overview: an Analytics section (intake stat cards + trend charts) followed by
 * a Timeline of the bounty lifecycle. Trend charts await a backend analytics
 * endpoint, so they render the same empty state the hackathon charts use.
 */
export default function BountyOverviewPanel({
  overview,
}: {
  overview: BountyOperateOverview;
}) {
  const { intake } = overview;

  return (
    <div className='space-y-12'>
      {/* ── Analytics ── */}
      <section>
        <div className='mb-6 flex items-center gap-2'>
          <TrendingUp className='h-4 w-4 text-zinc-500' />
          <h2 className='text-xs font-medium tracking-wider text-zinc-500 uppercase'>
            Analytics
          </h2>
        </div>

        {/* Intake stat cards */}
        <div className='grid gap-4 sm:grid-cols-3'>
          <StatCard
            label='Applications'
            total={intake.applications.total}
            breakdown={[
              ['Submitted', intake.applications.submitted],
              ['Shortlisted', intake.applications.shortlisted],
              ['Selected', intake.applications.selected],
              ['Declined', intake.applications.declined],
              ['Withdrawn', intake.applications.withdrawn],
            ]}
          />
          <StatCard
            label='Submissions'
            total={intake.submissions.total}
            breakdown={[
              ['Pending', intake.submissions.pending],
              ['Accepted', intake.submissions.accepted],
              ['Rejected', intake.submissions.rejected],
              ['Disputed', intake.submissions.disputed],
            ]}
          />
          <StatCard
            label='Contributions'
            total={intake.contributions.count}
            breakdown={[
              [
                'Total',
                `${Number(intake.contributions.total).toLocaleString()} ${overview.rewardCurrency}`,
              ],
            ]}
          />
        </div>

        {/* Trend charts */}
        <div className='mt-6 grid gap-4 lg:grid-cols-2'>
          <ChartCard title='Submissions over time' />
          <ChartCard title='Applications trend' />
        </div>
      </section>

      {/* ── Details + prize tiers ── */}
      <section className='grid gap-4 lg:grid-cols-2'>
        <div className='rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5'>
          <h3 className='mb-3 text-sm font-semibold text-white'>Details</h3>
          <dl className='space-y-2 text-sm'>
            <Row
              label='Reward pool'
              value={`${overview.rewardAmount.toLocaleString()} ${overview.rewardCurrency}`}
            />
            {overview.submissionDeadline && (
              <div className='flex items-center justify-between gap-3'>
                <dt className='text-zinc-400'>Submission deadline</dt>
                <dd className='text-right'>
                  <DueCountdown
                    deadline={overview.submissionDeadline}
                    className='flex items-center gap-1.5 text-xs font-medium text-zinc-200'
                  />
                </dd>
              </div>
            )}
            {overview.applicationWindowCloseAt && (
              <div className='flex items-center justify-between gap-3'>
                <dt className='text-zinc-400'>Applications close</dt>
                <dd className='text-right'>
                  <DueCountdown
                    deadline={overview.applicationWindowCloseAt}
                    className='flex items-center gap-1.5 text-xs font-medium text-zinc-200'
                  />
                </dd>
              </div>
            )}
            {overview.maxApplicants != null && (
              <Row
                label='Max applicants'
                value={String(overview.maxApplicants)}
              />
            )}
            {overview.shortlistSize != null && (
              <Row
                label='Shortlist size'
                value={String(overview.shortlistSize)}
              />
            )}
            {overview.escrowEventId && (
              <Row label='Escrow event' value={overview.escrowEventId} mono />
            )}
          </dl>
        </div>

        <div className='rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5'>
          <h3 className='mb-3 text-sm font-semibold text-white'>Prize tiers</h3>
          {overview.prizeTiers.length === 0 ? (
            <p className='text-sm text-zinc-500'>No prize tiers configured.</p>
          ) : (
            <div className='space-y-2'>
              {overview.prizeTiers.map(tier => (
                <div
                  key={tier.position}
                  className='flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 px-4 py-2.5'
                >
                  <span className='text-sm font-medium text-zinc-300'>
                    {ordinal(tier.position)} place
                  </span>
                  <span className='text-primary text-sm font-semibold'>
                    {Number(tier.amount).toLocaleString()}{' '}
                    {overview.rewardCurrency}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Timeline ── */}
      <BountyTimeline overview={overview} />
    </div>
  );
}

function ChartCard({ title }: { title: string }) {
  return (
    <div className='flex min-w-0 flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4'>
      <div className='text-xs font-medium tracking-wide text-white uppercase'>
        {title}
      </div>
      <div className='flex h-[200px] flex-col items-center justify-center gap-2 text-zinc-600 sm:h-[240px]'>
        <LineChart className='h-6 w-6' />
        <p className='text-sm text-zinc-500'>No trend data yet</p>
      </div>
    </div>
  );
}

interface TimelineEvent {
  label: string;
  description: string;
  date?: string | null;
  state: 'completed' | 'ongoing' | 'upcoming';
}

function BountyTimeline({ overview }: { overview: BountyOperateOverview }) {
  const now = Date.now();
  const isTerminal =
    overview.status === 'completed' || overview.status === 'cancelled';

  const dated = (date?: string | null): TimelineEvent['state'] =>
    date && new Date(date).getTime() <= now ? 'completed' : 'upcoming';

  const events: TimelineEvent[] = [
    {
      label: 'Published',
      description: 'Bounty published and funded on-chain.',
      date: overview.createdAt,
      state: 'completed',
    },
  ];

  if (overview.applicationWindowCloseAt) {
    events.push({
      label: 'Applications close',
      description: 'The application window closes.',
      date: overview.applicationWindowCloseAt,
      state: dated(overview.applicationWindowCloseAt),
    });
  }
  if (overview.submissionDeadline) {
    events.push({
      label: 'Submission deadline',
      description: 'Work submissions close for review.',
      date: overview.submissionDeadline,
      state: dated(overview.submissionDeadline),
    });
  }

  events.push({
    label: overview.status === 'cancelled' ? 'Cancelled' : 'Completed',
    description:
      overview.status === 'cancelled'
        ? 'Bounty cancelled and escrow refunded.'
        : 'Winners selected and rewards paid out.',
    state: isTerminal ? 'completed' : 'upcoming',
  });

  return (
    <section>
      <div className='mb-6 flex items-center gap-2 border-t border-zinc-900 pt-8'>
        <Calendar className='h-4 w-4 text-zinc-500' />
        <h2 className='text-xs font-medium tracking-wider text-zinc-500 uppercase'>
          Timeline
        </h2>
      </div>

      <div className='space-y-0'>
        {events.map((phase, index) => {
          const isLast = index === events.length - 1;
          const isCompleted = phase.state === 'completed';
          const isOngoing = phase.state === 'ongoing';
          return (
            <div
              key={`${phase.label}-${index}`}
              className={`relative flex items-start gap-3 sm:gap-4 ${!isLast ? 'pb-6' : ''}`}
            >
              <div className='relative flex flex-col items-center'>
                {isCompleted ? (
                  <div className='z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10'>
                    <Check className='h-3 w-3 text-emerald-500' />
                  </div>
                ) : isOngoing ? (
                  <div className='z-10 flex shrink-0 items-center justify-center rounded-full bg-emerald-500/20 p-1'>
                    <div className='bg-primary h-4 w-4 shrink-0 rounded-full' />
                  </div>
                ) : (
                  <div className='z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-zinc-800 opacity-50' />
                )}
                {!isLast && (
                  <div className='absolute top-6 left-1/2 h-6 w-0.5 -translate-x-1/2'>
                    <div className='h-full border-l-2 border-dashed border-zinc-700' />
                  </div>
                )}
              </div>
              <div className='flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4'>
                <div className='min-w-0 flex-1'>
                  <h3 className='mb-1 text-sm font-medium text-white sm:text-base'>
                    {phase.label}
                  </h3>
                  <p
                    className={`text-xs sm:text-sm ${
                      isCompleted ? 'text-zinc-400' : 'text-white/40'
                    }`}
                  >
                    {phase.description}
                  </p>
                </div>
                {phase.date && (
                  <div className='shrink-0 text-xs whitespace-nowrap text-white/60 sm:text-sm'>
                    {new Date(phase.date).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function StatCard({
  label,
  total,
  breakdown,
}: {
  label: string;
  total: number;
  breakdown: Array<[string, string | number]>;
}) {
  return (
    <div className='rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5'>
      <p className='text-xs font-medium text-zinc-500'>{label}</p>
      <p className='mt-1 text-2xl font-bold text-white'>{total}</p>
      <dl className='mt-3 space-y-1 border-t border-zinc-800 pt-3'>
        {breakdown.map(([k, v]) => (
          <div key={k} className='flex items-center justify-between text-xs'>
            <dt className='text-zinc-500'>{k}</dt>
            <dd className='font-medium text-zinc-300'>{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className='flex items-center justify-between gap-3'>
      <dt className='text-zinc-400'>{label}</dt>
      <dd
        className={`max-w-[60%] truncate text-right font-medium text-white ${
          mono ? 'font-mono text-xs' : ''
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
