'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  ArrowLeft,
  Award,
  Calendar,
  Loader2,
  Target,
  Users,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import EmptyState from '@/components/EmptyState';
import { computeBountyModeLabel } from '@/components/organization/bounties/new/tabs/schemas/modeSchema';
import { useBounty, useMyBountyApplication } from '@/features/bounties';
import { BountyEntryCta } from './BountyEntryCta';
import BountySubmitPanel from './submit/BountySubmitPanel';

// Markdown renderer (matches the wizard's editor package).
const Markdown = dynamic(
  () => import('@uiw/react-md-editor').then(mod => mod.default.Markdown),
  { ssr: false }
);

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const ordinal = (n: number): string => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
};

export default function BountyDetail({ id }: { id: string }) {
  const { data: bounty, isLoading, error } = useBounty(id);
  const { data: myApplication } = useMyBountyApplication(id);

  if (isLoading) {
    return (
      <div className='flex min-h-[50vh] items-center justify-center'>
        <Loader2 className='h-6 w-6 animate-spin text-zinc-500' />
      </div>
    );
  }

  if (error || !bounty) {
    return (
      <div className='py-20'>
        <EmptyState
          title='Bounty not found'
          description='This bounty may have been removed or is not public.'
          type='compact'
        />
        <div className='mt-4 text-center'>
          <Link
            href='/bounties'
            className='text-primary text-sm hover:underline'
          >
            Back to bounties
          </Link>
        </div>
      </div>
    );
  }

  const modeLabel =
    bounty.entryType && bounty.claimType
      ? computeBountyModeLabel(bounty.entryType, bounty.claimType)
      : 'Bounty';
  const currency = bounty.rewardCurrency;

  return (
    <div>
      <Link
        href='/bounties'
        className='mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-white'
      >
        <ArrowLeft className='h-4 w-4' />
        Back to bounties
      </Link>

      <div className='grid gap-8 lg:grid-cols-[1fr_360px]'>
        {/* Main */}
        <div className='min-w-0'>
          <div className='mb-4 flex flex-wrap items-center gap-2'>
            <Badge
              variant='outline'
              className='rounded-full border-zinc-700 bg-zinc-800/60 px-3 py-1 text-xs font-medium text-zinc-200'
            >
              {modeLabel}
            </Badge>
            <Badge
              variant='outline'
              className='rounded-full border-zinc-700 bg-zinc-800/60 px-3 py-1 text-xs font-medium text-zinc-300 capitalize'
            >
              {bounty.status.replace(/_/g, ' ')}
            </Badge>
          </div>

          <h1 className='text-2xl font-bold tracking-tight text-white sm:text-3xl'>
            {bounty.title}
          </h1>
          <p className='mt-2 text-sm text-zinc-400'>
            by <span className='text-zinc-200'>{bounty.organization.name}</span>
          </p>

          {/* Description (markdown) */}
          <div className='boundless-markdown mt-8' data-color-mode='dark'>
            <Markdown
              source={bounty.description}
              style={{ background: 'transparent', color: '#e4e4e7' }}
            />
          </div>

          {/* Prize tiers */}
          {bounty.prizeTiers.length > 0 && (
            <div className='mt-10'>
              <h2 className='mb-3 flex items-center gap-2 text-lg font-semibold text-white'>
                <Award className='text-primary h-5 w-5' />
                Prize tiers
              </h2>
              <div className='space-y-2'>
                {bounty.prizeTiers
                  .slice()
                  .sort((a, b) => a.position - b.position)
                  .map(tier => (
                    <div
                      key={tier.position}
                      className='flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 px-4 py-3'
                    >
                      <span className='text-sm font-medium text-zinc-300'>
                        {ordinal(tier.position)} place
                      </span>
                      <span className='text-primary text-sm font-semibold'>
                        {Number(tier.amount).toLocaleString()} {currency}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className='space-y-4 lg:sticky lg:top-6 lg:self-start'>
          {/* Reward */}
          <div className='rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5'>
            <div className='flex items-center gap-3'>
              <div className='bg-primary/10 flex h-11 w-11 items-center justify-center rounded-xl'>
                <Target className='text-primary h-5 w-5' />
              </div>
              <div>
                <p className='text-primary text-xl font-bold'>
                  {bounty.rewardAmount > 0
                    ? `${bounty.rewardAmount.toLocaleString()} ${currency}`
                    : 'No reward set'}
                </p>
                <p className='text-xs text-zinc-500'>total reward pool</p>
              </div>
            </div>

            {/* Eligibility / mode facts */}
            <dl className='mt-4 space-y-2 border-t border-zinc-800 pt-4 text-sm'>
              {bounty.entryType === 'OPEN' &&
                bounty.claimType === 'SINGLE_CLAIM' &&
                bounty.reputationMinimum != null && (
                  <Row
                    label='Minimum reputation'
                    value={String(bounty.reputationMinimum)}
                  />
                )}
              {bounty.applicationWindowCloseAt && (
                <Row
                  icon={<Calendar className='h-3.5 w-3.5' />}
                  label='Applications close'
                  value={formatDate(bounty.applicationWindowCloseAt)}
                />
              )}
              {bounty.maxApplicants != null && (
                <Row
                  icon={<Users className='h-3.5 w-3.5' />}
                  label='Max applicants'
                  value={String(bounty.maxApplicants)}
                />
              )}
              {bounty.shortlistSize != null && (
                <Row
                  label='Shortlist size'
                  value={String(bounty.shortlistSize)}
                />
              )}
            </dl>
          </div>

          {/* Mode-aware CTA + caller status */}
          <BountyEntryCta
            bounty={bounty}
            myApplication={myApplication ?? null}
          />

          {/* Submit work (shown when the builder is eligible) */}
          <BountySubmitPanel
            bounty={bounty}
            myApplication={myApplication ?? null}
          />
        </aside>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className='flex items-center justify-between gap-3'>
      <dt className='flex items-center gap-1.5 text-zinc-400'>
        {icon}
        {label}
      </dt>
      <dd className='text-right font-medium text-white'>{value}</dd>
    </div>
  );
}
