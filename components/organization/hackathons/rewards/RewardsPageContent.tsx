'use client';

import React from 'react';
import { Megaphone, CheckCircle2, Trophy, Loader2 } from 'lucide-react';
import { BoundlessButton } from '@/components/buttons';
import PodiumSection from '@/components/organization/hackathons/rewards/PodiumSection';
import { TrackWinnersSection } from '@/components/organization/hackathons/rewards/TrackWinnersSection';
import SubmissionsList from '@/components/organization/hackathons/rewards/SubmissionsList';
import { Submission } from '@/components/organization/hackathons/rewards/types';
import type { HackathonTrackWinner } from '@/lib/api/hackathons';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface RewardsPageContentProps {
  submissions: Submission[];
  isLoadingSubmissions: boolean;
  maxRank: number;
  hasWinners: boolean;
  /** Opens the Step 2 payout wizard. */
  onPublishClick: () => void;
  onRankChange: (submissionId: string, newRank: number | null) => Promise<void>;
  /** Step 1: makes the winners public (publishes judging results). */
  onPublishResults: () => void;
  /** True while the Step 1 publish request is in flight. */
  isPublishingResults?: boolean;
  /** Whether judging results have been published (gates Step 2). */
  resultsPublished?: boolean;
  /**
   * Whether the hackathon is funded on-chain (events contract published).
   * Required, alongside `resultsPublished`, before winners can be paid.
   */
  canReward?: boolean;
  /**
   * Per-track winners stamped by publishResults. Rendered in a
   * dedicated section below the rank-based podium. Empty pre-publish
   * and on OVERALL_ONLY hackathons.
   */
  trackWinners?: HackathonTrackWinner[];
}

export const RewardsPageContent: React.FC<RewardsPageContentProps> = ({
  submissions,
  isLoadingSubmissions,
  maxRank,
  onPublishClick,
  onRankChange,
  onPublishResults,
  isPublishingResults = false,
  resultsPublished = false,
  canReward = false,
  trackWinners = [],
}) => {
  // Step 2 is unlocked only once results are public AND the hackathon is
  // funded on-chain. Surface the precise blocker so the organizer knows
  // which prerequisite is missing.
  const canRewardWinners = resultsPublished && canReward;
  const rewardDisabledHelper = !resultsPublished
    ? 'Publish results first.'
    : !canReward
      ? 'Hackathon is not funded on-chain yet.'
      : null;

  return (
    <div className='space-y-8'>
      {/* Two-step organizer flow: publish results, then reward winners. */}
      <section className='space-y-4'>
        <div>
          <h2 className='text-xl font-semibold text-white'>Finalize Rewards</h2>
          <p className='mt-1 text-sm text-gray-400'>
            Make the winners public, then reward them on-chain.
          </p>
        </div>

        <div className='grid gap-4 md:grid-cols-2'>
          {/* Step 1 — Publish Results */}
          <div className='bg-background-card flex flex-col gap-3 rounded-xl border border-gray-900 p-5'>
            <div className='flex items-center gap-2'>
              <span className='flex h-6 w-6 items-center justify-center rounded-full bg-white/5 text-xs font-semibold text-gray-300'>
                1
              </span>
              <h3 className='text-sm font-semibold text-white'>
                Publish Results
              </h3>
            </div>
            {resultsPublished ? (
              <div className='flex items-center gap-2 text-sm text-green-400'>
                <CheckCircle2 className='h-4 w-4' />
                Results published
              </div>
            ) : (
              <>
                <p className='text-xs text-gray-400'>
                  Make the winners public, then reward them on-chain.
                </p>
                <BoundlessButton
                  variant='outline'
                  size='default'
                  onClick={onPublishResults}
                  disabled={isPublishingResults}
                  className='mt-auto w-fit gap-2 border-gray-700'
                >
                  {isPublishingResults ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <Trophy className='h-4 w-4' />
                  )}
                  {isPublishingResults ? 'Publishing...' : 'Publish Results'}
                </BoundlessButton>
              </>
            )}
          </div>

          {/* Step 2 — Reward Winners */}
          <div className='bg-background-card flex flex-col gap-3 rounded-xl border border-gray-900 p-5'>
            <div className='flex items-center gap-2'>
              <span className='flex h-6 w-6 items-center justify-center rounded-full bg-white/5 text-xs font-semibold text-gray-300'>
                2
              </span>
              <h3 className='text-sm font-semibold text-white'>
                Reward Winners
              </h3>
            </div>
            <p className='text-xs text-gray-400'>
              Pay the winners their prizes on-chain.
            </p>
            <div className='mt-auto flex flex-col gap-1.5'>
              <BoundlessButton
                variant='default'
                size='default'
                onClick={onPublishClick}
                disabled={!canRewardWinners}
                className='w-fit gap-2'
              >
                <Megaphone className='h-4 w-4' />
                Reward Winners
              </BoundlessButton>
              {!canRewardWinners && rewardDisabledHelper && (
                <p className='text-xs text-amber-400/80'>
                  {rewardDisabledHelper}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {submissions.length > 0 && (
        <section>
          <div className='mb-6'>
            <h2 className='text-xl font-semibold text-white'>
              Winners & Rankings
            </h2>
            <p className='mt-1 text-sm text-gray-400'>
              Assign ranks to submissions and view the winners podium
            </p>
          </div>
          <div className='space-y-6'>
            <PodiumSection submissions={submissions} maxRank={maxRank} />
            <TrackWinnersSection trackWinners={trackWinners} />
            <div>
              <h3 className='mb-4 text-lg font-medium text-white'>
                All Submissions
              </h3>
              <SubmissionsList
                submissions={submissions}
                onRankChange={onRankChange}
                maxRank={maxRank}
              />
            </div>
          </div>
        </section>
      )}

      {submissions.length === 0 && !isLoadingSubmissions && (
        <section>
          <Alert className='border-gray-800 bg-gray-900/50'>
            <AlertCircle className='h-5 w-5 text-gray-400' />
            <AlertTitle className='text-white'>
              No Submissions Available
            </AlertTitle>
            <AlertDescription className='text-gray-300'>
              <p className='mb-2'>
                No judged submissions found. To assign winners and distribute
                prizes:
              </p>
              <ol className='ml-4 list-decimal space-y-1 text-sm'>
                <li>Ensure submissions have been shortlisted</li>
                <li>Complete the judging process</li>
                <li>Return here to assign ranks and publish winners</li>
              </ol>
            </AlertDescription>
          </Alert>
        </section>
      )}
    </div>
  );
};
