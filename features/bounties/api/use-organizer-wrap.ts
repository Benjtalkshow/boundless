'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { bountyKeys } from './keys';
import {
  archiveBounty,
  getBountyAnnouncement,
  getBountyResults,
  publishBountyResults,
  restoreBounty,
  type BountyAnnouncement,
  type BountyResults,
  type PublishBountyResultsBody,
} from './organizer-wrap-client';

/**
 * Public results (winners by tier + payout tx) for a completed bounty. Consumed
 * by the results view on both the organizer dashboard and the public detail.
 */
export function useBountyResults(
  bountyId: string | undefined,
  options: { enabled?: boolean } = {}
) {
  return useQuery<BountyResults>({
    queryKey: bountyKeys.results(bountyId ?? ''),
    queryFn: () => getBountyResults(bountyId as string),
    enabled: !!bountyId && (options.enabled ?? true),
  });
}

/** Published winner announcement (null until the organizer publishes one). */
export function useBountyAnnouncement(
  bountyId: string | undefined,
  options: { enabled?: boolean } = {}
) {
  return useQuery<BountyAnnouncement | null>({
    queryKey: bountyKeys.announcement(bountyId ?? ''),
    queryFn: () => getBountyAnnouncement(bountyId as string),
    enabled: !!bountyId && (options.enabled ?? true),
  });
}

/**
 * Publish the winner announcement. On success the backend fans out winner +
 * community notifications; we refresh the announcement and the overview so the
 * dashboard reflects the published state.
 */
export function usePublishBountyResults(
  organizationId: string,
  bountyId: string
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: PublishBountyResultsBody) =>
      publishBountyResults(organizationId, bountyId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: bountyKeys.announcement(bountyId),
      });
      void queryClient.invalidateQueries({
        queryKey: bountyKeys.overview(organizationId, bountyId),
      });
    },
  });
}

/** Archive a completed/cancelled bounty; refresh the overview + drafts list. */
export function useArchiveBounty(organizationId: string, bountyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => archiveBounty(organizationId, bountyId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: bountyKeys.overview(organizationId, bountyId),
      });
      void queryClient.invalidateQueries({
        queryKey: bountyKeys.drafts(organizationId),
      });
    },
  });
}

/** Restore an archived bounty; refresh the overview + drafts list. */
export function useRestoreBounty(organizationId: string, bountyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => restoreBounty(organizationId, bountyId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: bountyKeys.overview(organizationId, bountyId),
      });
      void queryClient.invalidateQueries({
        queryKey: bountyKeys.drafts(organizationId),
      });
    },
  });
}
