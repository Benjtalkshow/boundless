'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  archiveTreasuryWallet,
  createManagedTreasuryWallet,
  getWalletBalance,
  listTreasuryWallets,
  registerConnectedWallet,
  updateTreasuryWallet,
} from './api';
import { treasuryKeys } from './keys';

/** List an organization's treasury wallets (default first). */
export function useTreasuryWallets(organizationId?: string) {
  return useQuery({
    queryKey: treasuryKeys.wallets(organizationId ?? ''),
    queryFn: () => listTreasuryWallets(organizationId as string),
    enabled: !!organizationId,
    staleTime: 30_000,
  });
}

function useWalletInvalidation(organizationId: string) {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({
      queryKey: treasuryKeys.wallets(organizationId),
    });
}

/** Create a Tier 1 managed treasury wallet. */
export function useCreateManagedWallet(organizationId: string) {
  const invalidate = useWalletInvalidation(organizationId);
  return useMutation({
    mutationFn: (label: string) =>
      createManagedTreasuryWallet(organizationId, label),
    onSuccess: () => void invalidate(),
  });
}

/** Register a connected (Tier 2/3) wallet. */
export function useRegisterConnectedWallet(organizationId: string) {
  const invalidate = useWalletInvalidation(organizationId);
  return useMutation({
    mutationFn: (body: {
      publicKey: string;
      label: string;
      connectionMethod: string;
    }) => registerConnectedWallet(organizationId, body),
    onSuccess: () => void invalidate(),
  });
}

/** Update a wallet label / default flag. */
export function useUpdateWallet(organizationId: string) {
  const invalidate = useWalletInvalidation(organizationId);
  return useMutation({
    mutationFn: (vars: {
      walletId: string;
      patch: { label?: string; isDefault?: boolean };
    }) => updateTreasuryWallet(organizationId, vars.walletId, vars.patch),
    onSuccess: () => void invalidate(),
  });
}

/** Archive a wallet. */
export function useArchiveWallet(organizationId: string) {
  const invalidate = useWalletInvalidation(organizationId);
  return useMutation({
    mutationFn: (walletId: string) =>
      archiveTreasuryWallet(organizationId, walletId),
    onSuccess: () => void invalidate(),
  });
}

/** Live USDC + XLM balance for a wallet. */
export function useWalletBalance(organizationId: string, walletId?: string) {
  return useQuery({
    queryKey: treasuryKeys.balance(organizationId, walletId ?? ''),
    queryFn: () => getWalletBalance(organizationId, walletId as string),
    enabled: !!organizationId && !!walletId,
    staleTime: 15_000,
  });
}
