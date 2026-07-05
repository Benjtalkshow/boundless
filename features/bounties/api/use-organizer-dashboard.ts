'use client';

import { useQuery } from '@tanstack/react-query';

import { bountyKeys } from './keys';
import {
  getBountyOverview,
  listBountySubmissions,
  type BountyOperateOverview,
  type OrganizerBountySubmissionList,
  type OrganizerSubmissionsParams,
} from './organizer-dashboard-client';

/**
 * Operate-dashboard overview for the organizer management surface (#338 / #630).
 * Global query defaults apply: 4xx never retries, transient errors retry twice;
 * the shell renders an error/empty state on failure.
 */
export function useBountyOverview(
  organizationId: string | undefined,
  bountyId: string | undefined
) {
  return useQuery<BountyOperateOverview>({
    queryKey: bountyKeys.overview(organizationId ?? '', bountyId ?? ''),
    queryFn: () =>
      getBountyOverview(organizationId as string, bountyId as string),
    enabled: !!organizationId && !!bountyId,
  });
}

/**
 * Submitted work on a bounty, for the reviewing organizer (#337 / #632).
 * Pass `enabled: false` to keep the Submissions tab from fetching sealed
 * competition work before the deadline. This is a UX gate only: the API
 * returns the organizer's submissions regardless of visibility, so the
 * actual seal (if required) must be enforced server-side.
 */
export function useBountySubmissions(
  organizationId: string | undefined,
  bountyId: string | undefined,
  options: { params?: OrganizerSubmissionsParams; enabled?: boolean } = {}
) {
  const params = options.params ?? {};
  return useQuery<OrganizerBountySubmissionList>({
    queryKey: bountyKeys.orgSubmissions(
      organizationId ?? '',
      bountyId ?? '',
      params
    ),
    queryFn: () =>
      listBountySubmissions(
        organizationId as string,
        bountyId as string,
        params
      ),
    enabled: !!organizationId && !!bountyId && (options.enabled ?? true),
  });
}
