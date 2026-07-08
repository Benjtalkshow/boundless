'use client';

import { Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import {
  CalendarClock,
  Info,
  Loader2,
  Lock,
  Settings,
  ShieldAlert,
  Trophy,
} from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuthGuard } from '@/components/auth';
import Loading from '@/components/Loading';
import EmptyState from '@/components/EmptyState';
import BountyGeneralSettingsTab from '@/components/organization/bounties/settings/BountyGeneralSettingsTab';
import BountyTimelineSettingsTab from '@/components/organization/bounties/settings/BountyTimelineSettingsTab';
import BountySettingsPanel from '@/components/organization/bounties/manage/BountySettingsPanel';
import {
  useBountyOverview,
  type BountyOperateOverview,
} from '@/features/bounties';
import { ordinal } from '@/lib/utils';

const tabTriggerClassName =
  'data-[state=active]:border-b-primary rounded-none border-b-2 border-transparent bg-transparent px-0 pt-4 pb-3 text-sm font-medium text-zinc-400 transition-all data-[state=active]:text-white data-[state=active]:shadow-none flex items-center gap-2';

const SETTINGS_SECTIONS = new Set([
  'general',
  'rewards',
  'timeline',
  'closeout',
]);

export default function BountySettingsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <BountySettingsView />
    </Suspense>
  );
}

function BountySettingsView() {
  const params = useParams<{ id: string; bountyId: string }>();
  const searchParams = useSearchParams();
  const organizationId = params?.id ?? '';
  const bountyId = params?.bountyId ?? '';
  const requestedSection = searchParams?.get('section') ?? '';
  const initialSection = SETTINGS_SECTIONS.has(requestedSection)
    ? requestedSection
    : 'general';

  const {
    data: overview,
    isLoading,
    error,
  } = useBountyOverview(organizationId, bountyId);

  return (
    <AuthGuard redirectTo='/auth?mode=signin' fallback={<Loading />}>
      <div className='bg-background min-h-screen'>
        <div className='w-full px-6 py-8'>
          <div className='mb-6 flex items-center gap-3'>
            <Settings className='text-primary h-6 w-6' />
            <div>
              <h1 className='text-2xl font-bold text-white sm:text-3xl'>
                Bounty Settings
              </h1>
              <p className='text-sm text-zinc-400'>
                Configuration, rewards, timeline, and close-out.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className='flex min-h-[40vh] items-center justify-center'>
              <Loader2 className='h-6 w-6 animate-spin text-zinc-500' />
            </div>
          ) : error || !overview ? (
            <EmptyState
              title="Couldn't load this bounty"
              description='It may not exist, or you may not have access to manage it.'
              type='compact'
            />
          ) : (
            <BountySettingsContent
              organizationId={organizationId}
              bountyId={bountyId}
              overview={overview}
              defaultSection={initialSection}
            />
          )}
        </div>
      </div>
    </AuthGuard>
  );
}

function BountySettingsContent({
  organizationId,
  bountyId,
  overview,
  defaultSection,
}: {
  organizationId: string;
  bountyId: string;
  overview: BountyOperateOverview;
  defaultSection: string;
}) {
  return (
    <Tabs defaultValue={defaultSection} className='w-full'>
      <div className='mb-6 border-b border-zinc-900'>
        <TabsList className='inline-flex h-auto gap-6 bg-transparent p-0'>
          <TabsTrigger value='general' className={tabTriggerClassName}>
            <Info className='h-4 w-4' />
            General
          </TabsTrigger>
          <TabsTrigger value='rewards' className={tabTriggerClassName}>
            <Trophy className='h-4 w-4' />
            Rewards
          </TabsTrigger>
          <TabsTrigger value='timeline' className={tabTriggerClassName}>
            <CalendarClock className='h-4 w-4' />
            Timeline
          </TabsTrigger>
          <TabsTrigger value='closeout' className={tabTriggerClassName}>
            <ShieldAlert className='h-4 w-4' />
            Close-out
          </TabsTrigger>
        </TabsList>
      </div>

      {/* General — editable off-chain details. */}
      <TabsContent value='general' className='mt-0'>
        <BountyGeneralSettingsTab
          organizationId={organizationId}
          bountyId={bountyId}
        />
      </TabsContent>

      {/* Rewards — on-chain, immutable once funded. */}
      <TabsContent value='rewards' className='mt-0'>
        <div className='space-y-4'>
          <OnChainNotice />
          <div className='rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5'>
            <h3 className='mb-3 text-sm font-semibold text-white'>
              Reward pool
            </h3>
            <p className='text-primary text-2xl font-bold'>
              {overview.rewardAmount.toLocaleString()} {overview.rewardCurrency}
            </p>
            {overview.prizeTiers.length > 0 && (
              <div className='mt-4 space-y-2 border-t border-zinc-800 pt-4'>
                {overview.prizeTiers
                  .slice()
                  .sort((a, b) => a.position - b.position)
                  .map(tier => (
                    <div
                      key={tier.position}
                      className='flex items-center justify-between text-sm'
                    >
                      <span className='text-zinc-400'>
                        {ordinal(tier.position)} place
                      </span>
                      <span className='font-medium text-white'>
                        {Number(tier.amount).toLocaleString()}{' '}
                        {overview.rewardCurrency}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </TabsContent>

      {/* Timeline — on-chain submission deadline (read-only) + editable
          off-chain application window. */}
      <TabsContent value='timeline' className='mt-0'>
        <BountyTimelineSettingsTab
          organizationId={organizationId}
          bountyId={bountyId}
        />
      </TabsContent>

      {/* Close-out — cancel / refund + archive (moved from the dashboard). */}
      <TabsContent value='closeout' className='mt-0'>
        <BountySettingsPanel
          organizationId={organizationId}
          bountyId={bountyId}
          overview={overview}
        />
      </TabsContent>
    </Tabs>
  );
}

function OnChainNotice() {
  return (
    <div className='flex items-start gap-2.5 rounded-xl border border-zinc-800 bg-zinc-900/30 p-3.5 text-sm text-zinc-400'>
      <Lock className='mt-0.5 h-4 w-4 shrink-0 text-zinc-500' />
      <span>
        These values are anchored on-chain in the escrow and cannot be changed
        after funding.
      </span>
    </div>
  );
}
