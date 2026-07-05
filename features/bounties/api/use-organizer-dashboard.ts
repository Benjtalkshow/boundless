'use client';

import { useQuery } from '@tanstack/react-query';

import { bountyKeys } from './keys';
import {
  getBountyOverview,
  type BountyOperateOverview,
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
