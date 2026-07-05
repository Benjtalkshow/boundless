/**
 * Organizer applications review + decide surface (#631).
 *
 * The list endpoint is not typed in the generated schema (the backend handler
 * has no @ApiOkResponse), so the rows are hand-typed to
 * `BountyApplicationResponseDto` and read through the legacy axios `api`. The
 * select / shortlist / decline mutations have typed request bodies, so they go
 * through the typed openapi-fetch client.
 */
import { api } from '@/lib/api/api';
import { apiClient, unwrapData } from '@/lib/api';

import type { Schemas } from '@/lib/api';

export type OrganizerApplication = Schemas['BountyApplicationResponseDto'];
export type SelectApplicationBody = Schemas['SelectForSingleClaimDto'];
export type ShortlistApplicationsBody = Schemas['CreateShortlistDto'];
export type DeclineApplicationBody = Schemas['DeclineApplicationDto'];

function unwrap<T>(res: { data: unknown }): T {
  const body = res.data as { data?: T };
  return (
    body && typeof body === 'object' && 'data' in body
      ? body.data
      : (res.data as T)
  ) as T;
}

/** List applications on a bounty (organizer). Optionally filter by status. */
export const listBountyApplications = async (
  organizationId: string,
  bountyId: string,
  params: { status?: string } = {}
): Promise<OrganizerApplication[]> => {
  const q = params.status ? `?status=${encodeURIComponent(params.status)}` : '';
  return unwrap<OrganizerApplication[]>(
    await api.get(
      `/organizations/${organizationId}/bounties/${bountyId}/v2/applications${q}`
    )
  );
};

/** Select a single applicant (single-claim application modes). */
export const selectBountyApplication = async (
  organizationId: string,
  bountyId: string,
  body: SelectApplicationBody
): Promise<unknown> =>
  unwrapData(
    await apiClient.POST(
      '/api/organizations/{organizationId}/bounties/{bountyId}/v2/applications/select',
      { params: { path: { organizationId, bountyId } }, body }
    )
  );

/** Approve a shortlist of applicants (competition application modes). */
export const shortlistBountyApplications = async (
  organizationId: string,
  bountyId: string,
  body: ShortlistApplicationsBody
): Promise<unknown> =>
  unwrapData(
    await apiClient.POST(
      '/api/organizations/{organizationId}/bounties/{bountyId}/v2/applications/shortlist',
      { params: { path: { organizationId, bountyId } }, body }
    )
  );

/** Decline an application with an optional reason. */
export const declineBountyApplication = async (
  organizationId: string,
  bountyId: string,
  appId: string,
  body: DeclineApplicationBody
): Promise<unknown> =>
  unwrapData(
    await apiClient.POST(
      '/api/organizations/{organizationId}/bounties/{bountyId}/v2/applications/{appId}/decline',
      { params: { path: { organizationId, bountyId, appId } }, body }
    )
  );
