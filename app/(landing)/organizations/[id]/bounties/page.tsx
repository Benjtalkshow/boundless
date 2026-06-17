'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FileText, Plus, Trophy } from 'lucide-react';

import { BoundlessButton } from '@/components/buttons';
import { Badge } from '@/components/ui/badge';
import { AuthGuard } from '@/components/auth';
import Loading from '@/components/Loading';
import {
  useDraftList,
  useOrganizationBounties,
  type BountyDraft,
  type OrganizationBountyListItem,
} from '@/features/bounties';

const DRAFT_STATUSES = new Set(['draft', 'draft_awaiting_funding']);

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  draft_awaiting_funding: 'Publishing',
  open: 'Open',
  in_progress: 'In progress',
  submitted: 'Submitted',
  under_review: 'Under review',
  completed: 'Completed',
  cancelled: 'Cancelled',
  disputed: 'Disputed',
};

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === 'open' || status === 'in_progress'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
      : status === 'draft_awaiting_funding'
        ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
        : status === 'completed'
          ? 'border-primary/30 bg-primary/10 text-primary'
          : 'border-zinc-700 bg-zinc-800/60 text-zinc-300';
  return (
    <Badge variant='outline' className={tone}>
      {STATUS_LABEL[status] ?? status}
    </Badge>
  );
}

export default function OrganizationBountiesPage() {
  const params = useParams<{ id: string }>();
  const organizationId = params?.id ?? '';

  const draftsQuery = useDraftList(organizationId);
  const publishedQuery = useOrganizationBounties(organizationId);

  const drafts: BountyDraft[] = draftsQuery.data ?? [];
  // The root list returns every bounty; show only the published ones here
  // (drafts have their own section above).
  const published: OrganizationBountyListItem[] = useMemo(
    () =>
      (publishedQuery.data ?? []).filter(b => !DRAFT_STATUSES.has(b.status)),
    [publishedQuery.data]
  );

  const isLoading = draftsQuery.isLoading || publishedQuery.isLoading;

  return (
    <AuthGuard redirectTo='/auth?mode=signin' fallback={<Loading />}>
      <div className='bg-background-main-bg mx-auto max-w-6xl flex-1 px-6 py-8 text-white'>
        <div className='mb-8 flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-semibold text-white'>Bounties</h1>
            <p className='mt-1 text-sm text-zinc-400'>
              Host and manage bounties for your organization.
            </p>
          </div>
          <Link href={`/organizations/${organizationId}/bounties/new`}>
            <BoundlessButton size='lg' className='gap-2'>
              <Plus className='h-4 w-4' />
              Host a bounty
            </BoundlessButton>
          </Link>
        </div>

        {isLoading ? (
          <div className='py-20 text-center text-sm text-zinc-400'>
            Loading bounties…
          </div>
        ) : (
          <div className='space-y-10'>
            {/* Drafts */}
            <section>
              <h2 className='mb-3 flex items-center gap-2 text-sm font-medium text-zinc-300'>
                <FileText className='h-4 w-4 text-zinc-500' />
                Drafts
              </h2>
              {drafts.length === 0 ? (
                <p className='rounded-lg border border-dashed border-zinc-800 bg-zinc-900/30 p-6 text-sm text-zinc-500'>
                  No drafts yet. Start one with “Host a bounty”.
                </p>
              ) : (
                <div className='grid gap-3'>
                  {drafts.map(draft => (
                    <Link
                      key={draft.id}
                      href={`/organizations/${organizationId}/bounties/drafts/${draft.id}`}
                      className='flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 p-4 transition-colors hover:border-zinc-700'
                    >
                      <div className='min-w-0'>
                        <p className='truncate text-sm font-medium text-white'>
                          {draft.data?.scope?.title || 'Untitled bounty'}
                        </p>
                        <p className='mt-0.5 text-xs text-zinc-500'>
                          {draft.modeLabel ?? 'Mode not set'} ·{' '}
                          {draft.completedSteps?.length ?? 0}/4 sections
                        </p>
                      </div>
                      <div className='flex items-center gap-3'>
                        <StatusBadge status={draft.status} />
                        <span className='text-xs text-zinc-400'>Resume</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Published */}
            <section>
              <h2 className='mb-3 flex items-center gap-2 text-sm font-medium text-zinc-300'>
                <Trophy className='h-4 w-4 text-zinc-500' />
                Published
              </h2>
              {published.length === 0 ? (
                <p className='rounded-lg border border-dashed border-zinc-800 bg-zinc-900/30 p-6 text-sm text-zinc-500'>
                  No published bounties yet.
                </p>
              ) : (
                <div className='grid gap-3'>
                  {published.map(bounty => (
                    <div
                      key={bounty.id}
                      className='flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 p-4'
                    >
                      <div className='min-w-0'>
                        <p className='truncate text-sm font-medium text-white'>
                          {bounty.title || 'Untitled bounty'}
                        </p>
                        {bounty.rewardAmount != null && (
                          <p className='mt-0.5 text-xs text-zinc-500'>
                            {bounty.rewardAmount.toLocaleString()}{' '}
                            {bounty.rewardCurrency ?? ''}
                          </p>
                        )}
                      </div>
                      <StatusBadge status={bounty.status} />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
