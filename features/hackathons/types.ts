/**
 * Hackathon feature types.
 *
 * Every server shape is aliased from the backend-generated OpenAPI schema
 * (lib/api/generated/schema.d.ts), so they never drift from boundless-nestjs.
 * Run `npm run codegen` after a backend DTO change to refresh them. Do not
 * hand-write server DTOs here.
 */
import type { Schemas } from '@/lib/api';

// ── Draft ────────────────────────────────────────────────────────────────────

/** Full draft as returned by GET/PATCH /draft/:id. */
export type HackathonDraft = Schemas['HackathonDraftResponseDto'];
/** Section-keyed draft payload (information, timeline, ...). */
export type HackathonDraftData = Schemas['HackathonDraftDataDto'];
/** Flat draft-update body: send any subset of sections in one PATCH. */
export type UpdateHackathonDraftBody = Schemas['UpdateHackathonDraftDto'];

// Section DTOs (the wire shape the backend persists + returns).
export type InfoSection = Schemas['InfoFormData'];
export type TimelineSection = Schemas['TimelineFormData'];
export type ParticipationSection = Schemas['ParticipantFormData'];
export type RewardsSection = Schemas['RewardsFormData'];
export type ResourcesSection = Schemas['ResourcesFormData'];
export type JudgingSection = Schemas['JudgingFormData'];
export type CollaborationSection = Schemas['CollaborationFormData'];

/** The seven editable wizard sections, in order. */
export const DRAFT_SECTIONS = [
  'information',
  'timeline',
  'participation',
  'rewards',
  'resources',
  'judging',
  'collaboration',
] as const;
export type DraftSection = (typeof DRAFT_SECTIONS)[number];

// ── Escrow ─────────────────────────────────────────────────────────────────

/** The EscrowOp row returned by every hackathon escrow endpoint. */
export type EscrowOpResponse = Schemas['HackathonEscrowOpResponseDto'];
/** Op lifecycle status (derived from the generated union). */
export type EscrowOpStatus = EscrowOpResponse['status'];
/** Contract operation kind (derived from the generated union). */
export type EscrowOpKind = EscrowOpResponse['kind'];

export type PublishHackathonEscrowRequest =
  Schemas['PublishHackathonEscrowDto'];
export type SelectHackathonWinnersRequest =
  Schemas['SelectHackathonWinnersDto'];
export type CancelHackathonEscrowRequest = Schemas['CancelHackathonEscrowDto'];
export type SubmitSignedXdrRequest = Schemas['HackathonSubmitSignedXdrDto'];
export type AnchorHackathonSubmissionRequest = Schemas['SubmitHackathonDto'];
export type WithdrawHackathonSubmissionRequest =
  Schemas['WithdrawHackathonSubmissionDto'];
export type WinnerDistributionEntry = Schemas['WinnerDistributionEntryDto'];
export type HackathonWinnerSelection = Schemas['HackathonWinnerSelectionDto'];
export type RequestFundingOtpResponse = Schemas['RequestFundingOtpResponseDto'];
export type VerifyFundingOtpResponse = Schemas['VerifyFundingOtpResponseDto'];

/** Signing path for an escrow op. */
export type FundingMode = NonNullable<
  PublishHackathonEscrowRequest['fundingMode']
>;

/** Terminal op states. Polling should stop once one is reached. */
export const TERMINAL_ESCROW_STATUSES: readonly EscrowOpStatus[] = [
  'COMPLETED',
  'FAILED',
  'CANCELLED',
];

export const isTerminalEscrowStatus = (status: EscrowOpStatus): boolean =>
  TERMINAL_ESCROW_STATUSES.includes(status);
