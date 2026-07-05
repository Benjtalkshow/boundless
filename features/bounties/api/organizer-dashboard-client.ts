/**
 * Organizer operate-dashboard reads (boundless-nestjs #338).
 *
 * Types are aliased from the generated OpenAPI schema; calls go through the
 * typed openapi-fetch client, with the `{ success, data }` envelope unwrapped
 * by the apiClient middleware + `unwrapData`.
 */
import { apiClient, unwrapData, type Schemas } from '@/lib/api';

export type BountyOperateApplicationStats =
  Schemas['BountyApplicationStatsDto'];
export type BountyOperateSubmissionStats = Schemas['BountySubmissionStatsDto'];
export type BountyOperateContributionStats =
  Schemas['BountyContributionStatsDto'];
export type BountyOperateIntake = Schemas['BountyOperateIntakeDto'];
export type BountyOverviewPrizeTier = Schemas['BountyOverviewPrizeTierDto'];

/** One read that powers the management dashboard header + stats (#338). */
export type BountyOperateOverview = Schemas['BountyOperateOverviewDto'];

export const getBountyOverview = async (
  organizationId: string,
  bountyId: string
): Promise<BountyOperateOverview> =>
  unwrapData(
    await apiClient.GET(
      '/api/organizations/{organizationId}/bounties/{bountyId}/overview',
      { params: { path: { organizationId, bountyId } } }
    )
  );
