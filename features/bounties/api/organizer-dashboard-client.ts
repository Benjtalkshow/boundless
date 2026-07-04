/**
 * Organizer operate-dashboard reads (boundless-nestjs #338).
 *
 * Types are aliased from the generated OpenAPI schema. Transport still goes
 * through the legacy axios `api` (cookie auth, `{ success, data }` envelope)
 * since the org-scoped route returns the enveloped payload.
 */
import { api } from '@/lib/api/api';

import type { Schemas } from '@/lib/api';

export type BountyOperateApplicationStats =
  Schemas['BountyApplicationStatsDto'];
export type BountyOperateSubmissionStats = Schemas['BountySubmissionStatsDto'];
export type BountyOperateContributionStats =
  Schemas['BountyContributionStatsDto'];
export type BountyOperateIntake = Schemas['BountyOperateIntakeDto'];
export type BountyOverviewPrizeTier = Schemas['BountyOverviewPrizeTierDto'];

/** One read that powers the management dashboard header + stats (#338). */
export type BountyOperateOverview = Schemas['BountyOperateOverviewDto'];

/** Unwrap the `{ success, data }` envelope (some routes return the payload bare). */
function unwrap<T>(res: { data: unknown }): T {
  const body = res.data as { data?: T };
  return (
    body && typeof body === 'object' && 'data' in body
      ? body.data
      : (res.data as T)
  ) as T;
}

export const getBountyOverview = async (
  organizationId: string,
  bountyId: string
): Promise<BountyOperateOverview> =>
  unwrap<BountyOperateOverview>(
    await api.get(
      `/organizations/${organizationId}/bounties/${bountyId}/overview`
    )
  );

// ── Organizer submissions review (#337 / #632) ────────────────────────────────

export type OrganizerBountySubmission = Schemas['OrganizerBountySubmissionDto'];
export type OrganizerBountySubmissionList =
  Schemas['OrganizerBountySubmissionListDto'];
export type OrganizerSubmissionUser = Schemas['OrganizerSubmissionUserDto'];

export interface OrganizerSubmissionsParams {
  status?: string;
  page?: number;
  limit?: number;
}

function withQuery(path: string, params: OrganizerSubmissionsParams): string {
  const q = new URLSearchParams();
  if (params.status) q.set('status', params.status);
  if (params.page != null) q.set('page', String(params.page));
  if (params.limit != null) q.set('limit', String(params.limit));
  const s = q.toString();
  return s ? `${path}?${s}` : path;
}

/** List the submitted work on a bounty for the reviewing organizer. */
export const listBountySubmissions = async (
  organizationId: string,
  bountyId: string,
  params: OrganizerSubmissionsParams = {}
): Promise<OrganizerBountySubmissionList> =>
  unwrap<OrganizerBountySubmissionList>(
    await api.get(
      withQuery(
        `/organizations/${organizationId}/bounties/${bountyId}/submissions`,
        params
      )
    )
  );
