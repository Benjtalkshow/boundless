'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { bountyKeys } from './keys';
import {
  declineBountyApplication,
  listBountyApplications,
  selectBountyApplication,
  shortlistBountyApplications,
  type DeclineApplicationBody,
  type OrganizerApplication,
  type SelectApplicationBody,
  type ShortlistApplicationsBody,
} from './organizer-applications-client';

/** Applications on a bounty, for the reviewing organizer (#631). */
export function useBountyApplications(
  organizationId: string | undefined,
  bountyId: string | undefined,
  params: { status?: string } = {}
) {
  return useQuery<OrganizerApplication[]>({
    queryKey: bountyKeys.orgApplications(
      organizationId ?? '',
      bountyId ?? '',
      params
    ),
    queryFn: () =>
      listBountyApplications(
        organizationId as string,
        bountyId as string,
        params
      ),
    enabled: !!organizationId && !!bountyId,
    retry: false,
  });
}

/** Shared invalidation: refresh the applications list + the overview stats. */
function useInvalidateApplications(organizationId: string, bountyId: string) {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({
      queryKey: [
        ...bountyKeys.all,
        'org-applications',
        organizationId,
        bountyId,
      ],
    });
    void qc.invalidateQueries({
      queryKey: bountyKeys.overview(organizationId, bountyId),
    });
  };
}

export function useSelectApplication(organizationId: string, bountyId: string) {
  const invalidate = useInvalidateApplications(organizationId, bountyId);
  return useMutation({
    mutationFn: (body: SelectApplicationBody) =>
      selectBountyApplication(organizationId, bountyId, body),
    onSuccess: invalidate,
  });
}

export function useShortlistApplications(
  organizationId: string,
  bountyId: string
) {
  const invalidate = useInvalidateApplications(organizationId, bountyId);
  return useMutation({
    mutationFn: (body: ShortlistApplicationsBody) =>
      shortlistBountyApplications(organizationId, bountyId, body),
    onSuccess: invalidate,
  });
}

export function useDeclineApplication(
  organizationId: string,
  bountyId: string
) {
  const invalidate = useInvalidateApplications(organizationId, bountyId);
  return useMutation({
    mutationFn: (input: { appId: string; body: DeclineApplicationBody }) =>
      declineBountyApplication(
        organizationId,
        bountyId,
        input.appId,
        input.body
      ),
    onSuccess: invalidate,
  });
}
