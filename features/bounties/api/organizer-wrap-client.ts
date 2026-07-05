/**
 * Bounty Wrap API client (#635): the organizer close-out actions and the public
 * results/announcement reads. Request/response shapes come from the backend
 * generated schema, so they never drift from boundless-nestjs.
 *
 *   - publish-results : organizer publishes the winner announcement (message),
 *                       which fans out winner + community notifications.
 *   - archive/restore : soft-close a completed/cancelled bounty (never a hard
 *                       delete); restore brings it back.
 *   - results / announcement : public reads consumed by the completed-bounty
 *                       results view.
 */
import { apiClient, unwrapData, type Schemas } from '@/lib/api';

// ── Types (aliased from the generated schema) ────────────────────────────────
export type BountyResults = Schemas['BountyResultsDto'];
export type BountyResultsWinner = Schemas['BountyWinnerDto'];
export type BountyAnnouncement = Schemas['BountyAnnouncementDto'];
export type PublishBountyResultsBody = Schemas['PublishBountyResultsDto'];

// ── Organizer close-out actions ──────────────────────────────────────────────

/** Publish the winner announcement; triggers winner + community notifications. */
export const publishBountyResults = async (
  organizationId: string,
  bountyId: string,
  body: PublishBountyResultsBody
): Promise<BountyAnnouncement> =>
  unwrapData(
    await apiClient.POST(
      '/api/organizations/{organizationId}/bounties/{bountyId}/publish-results',
      { params: { path: { organizationId, bountyId } }, body }
    )
  );

/** Archive a completed/cancelled bounty (soft close; never a hard delete). */
export const archiveBounty = async (
  organizationId: string,
  bountyId: string
): Promise<void> => {
  await apiClient.POST(
    '/api/organizations/{organizationId}/bounties/{bountyId}/archive',
    { params: { path: { organizationId, bountyId } } }
  );
};

/** Restore an archived bounty. */
export const restoreBounty = async (
  organizationId: string,
  bountyId: string
): Promise<void> => {
  await apiClient.POST(
    '/api/organizations/{organizationId}/bounties/{bountyId}/restore',
    { params: { path: { organizationId, bountyId } } }
  );
};

// ── Public reads (results view) ──────────────────────────────────────────────

/** Public results / leaderboard: winners by tier + payout tx. */
export const getBountyResults = async (
  bountyId: string
): Promise<BountyResults> =>
  unwrapData(
    await apiClient.GET('/api/bounties/{id}/results', {
      params: { path: { id: bountyId } },
    })
  );

/** Public winner announcement (null when none published yet). */
export const getBountyAnnouncement = async (
  bountyId: string
): Promise<BountyAnnouncement | null> => {
  const { data } = await apiClient.GET('/api/bounties/{bountyId}/announcement', {
    params: { path: { bountyId } },
  });
  return data ?? null;
};
