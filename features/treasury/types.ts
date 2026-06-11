// Treasury feature types. Hand-written to mirror the backend treasury DTOs
// (boundless-nestjs treasury module). Migrate to generated OpenAPI types once
// the treasury endpoints are in the committed schema snapshot.

export type TreasuryWalletKind = 'MANAGED' | 'CONNECTED';
export type TreasuryWalletStatus = 'ACTIVE' | 'ARCHIVED' | 'NEEDS_REVIEW';

export interface TreasuryWallet {
  id: string;
  organizationId: string;
  kind: TreasuryWalletKind;
  publicKey: string;
  label: string;
  isDefault: boolean;
  status: TreasuryWalletStatus;
  isMultisig: boolean;
  multisigThreshold: number | null;
  connectionMethod: string | null;
  lastVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WalletBalance {
  publicKey: string;
  usdc: string;
  xlm: string;
}

export interface TreasuryPolicyRule {
  min_usdc: number;
  max_usdc: number | null;
  required_approvals: number;
  approver_roles: string[];
}

export interface TreasuryPolicy {
  organizationId: string;
  defaultWalletId: string | null;
  rules: TreasuryPolicyRule[];
  isDefault: boolean;
  updatedAt: string | null;
}

export type SpendStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'AWAITING_SIGNATURES'
  | 'SUBMITTED'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export interface SpendApproval {
  user_id: string;
  action: 'approve' | 'reject';
  note?: string;
  timestamp: string;
}

export interface SpendRequest {
  id: string;
  organizationId: string;
  sourceWalletId: string;
  destination: string;
  amount: string;
  currency: string;
  purpose: string;
  referenceType: string | null;
  referenceId: string | null;
  initiatorUserId: string;
  requiredApprovals: number;
  approvals: SpendApproval[];
  status: SpendStatus;
  onChainTxHash: string | null;
  createdAt: string;
  approvedAt: string | null;
}

export interface InitiateSpendInput {
  sourceWalletId: string;
  destination: string;
  amount: string;
  purpose: string;
  referenceType?: string;
  referenceId?: string;
}

export interface TreasuryAuditEntry {
  id: string;
  action: string;
  actorUserId: string | null;
  actorKind: string;
  walletId: string | null;
  spendRequestId: string | null;
  details: unknown;
  createdAt: string;
}

export interface TreasuryAuditPage {
  data: TreasuryAuditEntry[];
  total: number;
  page: number;
  limit: number;
}

export interface BuildSpendXdrResult {
  unsignedXdr: string;
  request: SpendRequest;
}
