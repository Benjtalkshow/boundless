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
 * Pass `enabled: false` to keep sealed competition work unfetched until the
 * deadline (the FE gate) so it never reaches the browser early.
 */
export function useBountySubmissions(
  organizationId: string | undefined,
  bountyId: string | undefined,
  params: OrganizerSubmissionsParams = {},
  options: { enabled?: boolean } = {}
) {
  return useQuery<OrganizerBountySubmissionList>({
    queryKey: bountyKeys.orgSubmissions(
      organizationId ?? '',
      bountyId ?? '',
      params as Record<string, unknown>
    ),
    queryFn: () =>
      listBountySubmissions(
        organizationId as string,
        bountyId as string,
        params
      ),
    enabled: !!organizationId && !!bountyId && (options.enabled ?? true),
    retry: false,
  });
}
