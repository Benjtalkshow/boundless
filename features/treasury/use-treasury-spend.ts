'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  approveSpend,
  buildSpendXdr,
  cancelSpend,
  executeSpend,
  initiateSpend,
  listSpendRequests,
  rejectSpend,
  submitSpendSignedXdr,
} from './api';
import { treasuryKeys } from './keys';
import type { InitiateSpendInput, SpendStatus } from './types';

export function useSpendRequests(
  organizationId?: string,
  status?: SpendStatus
) {
  return useQuery({
    queryKey: treasuryKeys.spends(organizationId ?? '', status),
    queryFn: () => listSpendRequests(organizationId as string, status),
    enabled: !!organizationId,
    staleTime: 10_000,
  });
}

function useSpendInvalidation(organizationId: string) {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({
      queryKey: ['treasury', 'spends', organizationId],
    });
}

export function useInitiateSpend(organizationId: string) {
  const invalidate = useSpendInvalidation(organizationId);
  return useMutation({
    mutationFn: (body: InitiateSpendInput) =>
      initiateSpend(organizationId, body),
    onSuccess: () => void invalidate(),
  });
}

/** approve / reject / cancel / execute, keyed by action. */
export function useSpendDecision(organizationId: string) {
  const invalidate = useSpendInvalidation(organizationId);
  return useMutation({
    mutationFn: (vars: {
      requestId: string;
      action: 'approve' | 'reject' | 'cancel' | 'execute';
      note?: string;
    }) => {
      switch (vars.action) {
        case 'approve':
          return approveSpend(organizationId, vars.requestId, vars.note);
        case 'reject':
          return rejectSpend(organizationId, vars.requestId, vars.note);
        case 'cancel':
          return cancelSpend(organizationId, vars.requestId);
        case 'execute':
          return executeSpend(organizationId, vars.requestId);
      }
    },
    onSuccess: () => void invalidate(),
  });
}

export function useBuildSpendXdr(organizationId: string) {
  const invalidate = useSpendInvalidation(organizationId);
  return useMutation({
    mutationFn: (requestId: string) => buildSpendXdr(organizationId, requestId),
    onSuccess: () => void invalidate(),
  });
}

export function useSubmitSignedXdr(organizationId: string) {
  const invalidate = useSpendInvalidation(organizationId);
  return useMutation({
    mutationFn: (vars: { requestId: string; signedXdr: string }) =>
      submitSpendSignedXdr(organizationId, vars.requestId, vars.signedXdr),
    onSuccess: () => void invalidate(),
  });
}
