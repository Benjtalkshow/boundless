import { z } from 'zod';

/**
 * Scope step: the bounty's identity. Mirrors the backend BountyScopeSection
 * (title / description / optional GitHub issue / optional project + window).
 * The reward currency lives in the Reward step alongside the prize tiers it
 * denominates (that is the section the backend persists it under).
 */
export const scopeSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or fewer'),
  description: z
    .string()
    .trim()
    .min(1, 'Description is required')
    .max(5000, 'Description must be 5000 characters or fewer'),
  githubIssueUrl: z
    .union([z.string().url('Enter a valid URL'), z.literal(''), z.null()])
    .optional()
    .transform(v => (v === '' ? null : v)),
  githubIssueNumber: z
    .union([z.number().int().positive(), z.null()])
    .optional(),
  projectId: z.union([z.string(), z.null()]).optional(),
  bountyWindowId: z.union([z.string(), z.null()]).optional(),
});

export type ScopeFormData = z.input<typeof scopeSchema>;
