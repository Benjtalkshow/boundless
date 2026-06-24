/**
 * Builder "my bounties" dashboard reads (boundless-nestjs #332).
 *
 * These endpoints aren't in the generated OpenAPI schema yet, so they go through
 * the legacy axios `api` (cookie auth, `{ success, data }` envelope) rather than
 * the typed openapi-fetch client. Swap to the typed client + generated types once
 * #332 lands and `npm run codegen` runs. Until the backend ships, calls 404 and
 * the hooks degrade to empty.
 */
import { api } from '@/lib/api/api';

import type {
  BountyActivityPage,
  MyBountyApplicationRow,
  MyBountySubmissionRow,
} from '../types';

export interface MyActivityParams {
  status?: string;
  page?: number;
  limit?: number;
}

/** Unwrap the `{ success, data }` envelope (some routes return the payload bare). */
function unwrap<T>(res: { data: unknown }): T {
  const body = res.data as { data?: T };
  return (
    body && typeof body === 'object' && 'data' in body
      ? body.data
      : (res.data as T)
  ) as T;
}

/** The legacy `api` RequestConfig has no `params`, so encode the query inline. */
function withQuery(path: string, params: MyActivityParams): string {
  const q = new URLSearchParams();
  if (params.status) q.set('status', params.status);
  if (params.page != null) q.set('page', String(params.page));
  if (params.limit != null) q.set('limit', String(params.limit));
  const s = q.toString();
  return s ? `${path}?${s}` : path;
}

export const listMyBountyApplications = async (
  params: MyActivityParams = {}
): Promise<BountyActivityPage<MyBountyApplicationRow>> =>
  unwrap(await api.get(withQuery('/bounties/me/applications', params)));

export const listMyBountySubmissions = async (
  params: MyActivityParams = {}
): Promise<BountyActivityPage<MyBountySubmissionRow>> =>
  unwrap(await api.get(withQuery('/bounties/me/submissions', params)));
