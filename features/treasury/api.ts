import { api } from '@/lib/api/api';
import type {
  BuildSpendXdrResult,
  InitiateSpendInput,
  SpendRequest,
  SpendStatus,
  TreasuryAuditPage,
  TreasuryPolicy,
  TreasuryPolicyRule,
  TreasuryWallet,
  WalletBalance,
} from './types';

// The NestJS global interceptor wraps payloads in { success, message, data }.
// Tolerate a bare payload too (matches lib/api/hackathons/escrow.ts).
interface Wrapped<T> {
  success?: boolean;
  message?: string;
  data: T;
}

const unwrap = <T>(body: T | Wrapped<T>): T =>
  body &&
  typeof body === 'object' &&
  'data' in body &&
  (body as Wrapped<T>).data !== undefined
    ? (body as Wrapped<T>).data
    : (body as T);

const base = (organizationId: string) =>
  `/organizations/${organizationId}/treasury`;

// ── Wallets ──────────────────────────────────────────────────────────────

export const listTreasuryWallets = async (
  organizationId: string
): Promise<TreasuryWallet[]> => {
  const { data } = await api.get<TreasuryWallet[] | Wrapped<TreasuryWallet[]>>(
    `${base(organizationId)}/wallets`
  );
  return unwrap(data) ?? [];
};

export const createManagedTreasuryWallet = async (
  organizationId: string,
  label: string
): Promise<TreasuryWallet> => {
  const { data } = await api.post<TreasuryWallet | Wrapped<TreasuryWallet>>(
    `${base(organizationId)}/wallets/managed`,
    { label }
  );
  return unwrap(data);
};

export const registerConnectedWallet = async (
  organizationId: string,
  body: { publicKey: string; label: string; connectionMethod: string }
): Promise<TreasuryWallet> => {
  const { data } = await api.post<TreasuryWallet | Wrapped<TreasuryWallet>>(
    `${base(organizationId)}/wallets/connected`,
    body
  );
  return unwrap(data);
};

export const updateTreasuryWallet = async (
  organizationId: string,
  walletId: string,
  patch: { label?: string; isDefault?: boolean }
): Promise<TreasuryWallet> => {
  const { data } = await api.patch<TreasuryWallet | Wrapped<TreasuryWallet>>(
    `${base(organizationId)}/wallets/${walletId}`,
    patch
  );
  return unwrap(data);
};

export const archiveTreasuryWallet = async (
  organizationId: string,
  walletId: string
): Promise<TreasuryWallet> => {
  const { data } = await api.post<TreasuryWallet | Wrapped<TreasuryWallet>>(
    `${base(organizationId)}/wallets/${walletId}/archive`
  );
  return unwrap(data);
};

export const getWalletBalance = async (
  organizationId: string,
  walletId: string
): Promise<WalletBalance> => {
  const { data } = await api.get<WalletBalance | Wrapped<WalletBalance>>(
    `${base(organizationId)}/wallets/${walletId}/balance`
  );
  return unwrap(data);
};

export const getDefaultTreasuryWallet = async (
  organizationId: string
): Promise<TreasuryWallet> => {
  const { data } = await api.get<TreasuryWallet | Wrapped<TreasuryWallet>>(
    `${base(organizationId)}/default-wallet`
  );
  return unwrap(data);
};

// ── Policy ───────────────────────────────────────────────────────────────

export const getTreasuryPolicy = async (
  organizationId: string
): Promise<TreasuryPolicy> => {
  const { data } = await api.get<TreasuryPolicy | Wrapped<TreasuryPolicy>>(
    `${base(organizationId)}/policy`
  );
  return unwrap(data);
};

export const updateTreasuryPolicy = async (
  organizationId: string,
  body: { rules: TreasuryPolicyRule[]; defaultWalletId?: string }
): Promise<TreasuryPolicy> => {
  const { data } = await api.put<TreasuryPolicy | Wrapped<TreasuryPolicy>>(
    `${base(organizationId)}/policy`,
    body
  );
  return unwrap(data);
};

// ── Spend requests ───────────────────────────────────────────────────────

export const listSpendRequests = async (
  organizationId: string,
  status?: SpendStatus
): Promise<SpendRequest[]> => {
  const query = status ? `?status=${status}` : '';
  const { data } = await api.get<SpendRequest[] | Wrapped<SpendRequest[]>>(
    `${base(organizationId)}/spend${query}`
  );
  return unwrap(data) ?? [];
};

export const initiateSpend = async (
  organizationId: string,
  body: InitiateSpendInput
): Promise<SpendRequest> => {
  const { data } = await api.post<SpendRequest | Wrapped<SpendRequest>>(
    `${base(organizationId)}/spend`,
    body
  );
  return unwrap(data);
};

const spendAction = async (
  organizationId: string,
  requestId: string,
  action: 'approve' | 'reject' | 'cancel' | 'execute',
  body?: { note?: string }
): Promise<SpendRequest> => {
  const { data } = await api.post<SpendRequest | Wrapped<SpendRequest>>(
    `${base(organizationId)}/spend/${requestId}/${action}`,
    body ?? {}
  );
  return unwrap(data);
};

export const approveSpend = (
  organizationId: string,
  requestId: string,
  note?: string
) => spendAction(organizationId, requestId, 'approve', { note });

export const rejectSpend = (
  organizationId: string,
  requestId: string,
  note?: string
) => spendAction(organizationId, requestId, 'reject', { note });

export const cancelSpend = (organizationId: string, requestId: string) =>
  spendAction(organizationId, requestId, 'cancel');

export const executeSpend = (organizationId: string, requestId: string) =>
  spendAction(organizationId, requestId, 'execute');

export const buildSpendXdr = async (
  organizationId: string,
  requestId: string
): Promise<BuildSpendXdrResult> => {
  const { data } = await api.post<
    BuildSpendXdrResult | Wrapped<BuildSpendXdrResult>
  >(`${base(organizationId)}/spend/${requestId}/build-xdr`);
  return unwrap(data);
};

export const submitSpendSignedXdr = async (
  organizationId: string,
  requestId: string,
  signedXdr: string
): Promise<SpendRequest> => {
  const { data } = await api.post<SpendRequest | Wrapped<SpendRequest>>(
    `${base(organizationId)}/spend/${requestId}/submit-signed-xdr`,
    { signedXdr }
  );
  return unwrap(data);
};

// ── Audit log ────────────────────────────────────────────────────────────

export const getAuditLog = async (
  organizationId: string,
  page = 1,
  limit = 50
): Promise<TreasuryAuditPage> => {
  const { data } = await api.get<
    TreasuryAuditPage | Wrapped<TreasuryAuditPage>
  >(`${base(organizationId)}/audit-log?page=${page}&limit=${limit}`);
  return unwrap(data);
};
