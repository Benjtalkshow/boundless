'use client';

import { useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Info, Loader2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import EmptyState from '@/components/EmptyState';
import { bountyStatusClass } from '@/components/bounties/statusClass';
import {
  computeBountyModeLabel,
  computeBountyModeDescription,
} from '@/components/organization/bounties/new/tabs/schemas/modeSchema';
import { useBountyOverview } from '@/features/bounties';
import BountyOverviewPanel from './BountyOverviewPanel';
import BountySubmissionsPanel from './BountySubmissionsPanel';
import BountyPayoutPanel from './BountyPayoutPanel';
import BountyApplicationsPanel from './BountyApplicationsPanel';
import BountyResultsPanel from './BountyResultsPanel';

/** Tabs the org bounty list can deep-link into via `?tab=`. */
const LINKABLE_TABS = new Set([
  'overview',
  'applications',
  'submissions',
  'payout',
  'results',
]);

export default function BountyManagementDashboard() {
  const params = useParams<{ id: string; bountyId: string }>();
  const searchParams = useSearchParams();
  const organizationId = params?.id ?? '';
  const bountyId = params?.bountyId ?? '';
  const requestedTab = searchParams?.get('tab') ?? '';

  // Winner staging lives here (above the tab boundary) so it survives tab
  // switches and is reachable by the Payout tab (#633).
  const [stagedWinners, setStagedWinners] = useState<Set<string>>(new Set());
  const toggleStagedWinner = (id: string) =>
    setStagedWinners(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

  const {
    data: overview,
    isLoading,
    error,
  } = useBountyOverview(organizationId, bountyId);

  if (isLoading) {
    return (
      <div className='flex min-h-[50vh] items-center justify-center'>
        <Loader2 className='h-6 w-6 animate-spin text-zinc-500' />
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className='py-20'>
        <EmptyState
          title="Couldn't load this bounty"
          description='It may not exist, or you may not have access to manage it.'
          type='compact'
        />
        <div className='mt-4 text-center'>
          <Link
            href={`/organizations/${organizationId}/bounties`}
            className='text-primary text-sm hover:underline'
          >
            Back to bounties
          </Link>
        </div>
      </div>
    );
  }

  const isApplication =
    overview.entryType === 'APPLICATION_LIGHT' ||
    overview.entryType === 'APPLICATION_FULL';
  const isCompleted = overview.status === 'completed';

  // Honor a deep-linked ?tab= only when that tab is actually available for this
  // bounty (applications need an application mode; results need completion).
  const tabAvailable =
    LINKABLE_TABS.has(requestedTab) &&
    (requestedTab !== 'applications' || isApplication) &&
    (requestedTab !== 'results' || isCompleted);
  const initialTab = tabAvailable ? requestedTab : 'overview';
  const modeLabel =
    overview.entryType && overview.claimType
      ? computeBountyModeLabel(overview.entryType, overview.claimType)
      : 'Bounty';
  const modeDescription =
    overview.entryType && overview.claimType
      ? computeBountyModeDescription(overview.entryType, overview.claimType)
      : null;
  const statusClass = bountyStatusClass(overview.status);

  return (
    <div>
      {/* Header */}
      <div className='mb-6'>
        <div className='mb-3 flex flex-wrap items-center gap-2'>
          <Badge
            variant='outline'
            className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${statusClass}`}
          >
            {overview.status.replace(/_/g, ' ')}
          </Badge>
          {modeDescription ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant='outline'
                  className='flex cursor-help items-center gap-1 rounded-full border-zinc-700 bg-zinc-800/60 px-3 py-1 text-xs font-medium text-zinc-200'
                >
                  {modeLabel}
                  <Info className='h-3 w-3 text-zinc-400' />
                </Badge>
              </TooltipTrigger>
              <TooltipContent className='max-w-xs text-xs leading-relaxed'>
                {modeDescription}
              </TooltipContent>
            </Tooltip>
          ) : (
            <Badge
              variant='outline'
              className='rounded-full border-zinc-700 bg-zinc-800/60 px-3 py-1 text-xs font-medium text-zinc-200'
            >
              {modeLabel}
            </Badge>
          )}
        </div>
        <h1 className='text-2xl font-bold tracking-tight text-white sm:text-3xl'>
          {overview.title}
        </h1>
      </div>

      {/* Sections are driven by the management sidebar via ?tab=. */}
      <Tabs value={initialTab}>
        <TabsContent value='overview'>
          <BountyOverviewPanel overview={overview} />
        </TabsContent>
        {isApplication && (
          <TabsContent value='applications'>
            <BountyApplicationsPanel
              organizationId={organizationId}
              bountyId={bountyId}
              overview={overview}
            />
          </TabsContent>
        )}
        <TabsContent value='submissions'>
          <BountySubmissionsPanel
            organizationId={organizationId}
            bountyId={bountyId}
            rewardCurrency={overview.rewardCurrency}
            staged={stagedWinners}
            onToggleStage={toggleStagedWinner}
          />
        </TabsContent>
        <TabsContent value='payout'>
          <BountyPayoutPanel
            organizationId={organizationId}
            bountyId={bountyId}
            overview={overview}
            staged={stagedWinners}
          />
        </TabsContent>
        {isCompleted && (
          <TabsContent value='results'>
            <BountyResultsPanel
              organizationId={organizationId}
              bountyId={bountyId}
              overview={overview}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
