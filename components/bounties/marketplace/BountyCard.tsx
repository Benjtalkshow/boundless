'use client';

import Link from 'next/link';
import { Calendar, Target } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { computeBountyModeLabel } from '@/components/organization/bounties/new/tabs/schemas/modeSchema';
import type { BountyPublic } from '@/features/bounties';

/** Plain-language mode label (single claim / competition / application). */
function modeLabel(b: BountyPublic): string {
  if (b.entryType && b.claimType) {
    return computeBountyModeLabel(b.entryType, b.claimType);
  }
  return 'Bounty';
}

const STATUS_CLASS: Record<string, string> = {
  open: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  in_progress: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  completed: 'border-primary/30 bg-primary/10 text-primary',
  cancelled: 'border-zinc-700 bg-zinc-800/60 text-zinc-300',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function BountyCard({ bounty }: { bounty: BountyPublic }) {
  const reward = bounty.rewardAmount > 0;
  const statusClass =
    STATUS_CLASS[bounty.status] ??
    'border-zinc-700 bg-zinc-800/60 text-zinc-300';

  return (
    <Link
      href={`/bounties/${bounty.id}`}
      className='group hover:border-primary/40 flex w-full flex-col rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 transition-colors hover:bg-zinc-900/70'
      aria-label={`View bounty ${bounty.title}`}
    >
      <div className='mb-3 flex items-center justify-between gap-2'>
        <Badge
          variant='outline'
          className='rounded-full border-zinc-700 bg-zinc-800/60 px-3 py-1 text-xs font-medium text-zinc-200'
        >
          {modeLabel(bounty)}
        </Badge>
        <Badge
          variant='outline'
          className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${statusClass}`}
        >
          {bounty.status.replace(/_/g, ' ')}
        </Badge>
      </div>

      <h3 className='group-hover:text-primary line-clamp-2 min-h-12 text-lg font-bold text-white transition-colors'>
        {bounty.title}
      </h3>
      {bounty.description && (
        <p className='mt-1 line-clamp-2 text-sm text-zinc-400'>
          {bounty.description}
        </p>
      )}

      {bounty.applicationWindowCloseAt && (
        <p className='mt-3 flex items-center gap-1.5 text-xs text-zinc-500'>
          <Calendar className='h-3.5 w-3.5' />
          Applications close {formatDate(bounty.applicationWindowCloseAt)}
        </p>
      )}

      <div className='mt-4 flex items-center justify-between gap-2 border-t border-zinc-800 pt-4'>
        <div className='flex items-center gap-2'>
          <div className='bg-primary/10 flex h-9 w-9 items-center justify-center rounded-lg'>
            <Target className='text-primary h-4 w-4' />
          </div>
          <div>
            <p className='text-primary text-base leading-tight font-bold'>
              {reward
                ? `${bounty.rewardAmount.toLocaleString()} ${bounty.rewardCurrency}`
                : 'No reward set'}
            </p>
            <p className='text-[11px] text-zinc-500'>reward</p>
          </div>
        </div>
        <span className='max-w-[45%] truncate text-right text-xs text-zinc-400'>
          {bounty.organization.name}
        </span>
      </div>
    </Link>
  );
}
