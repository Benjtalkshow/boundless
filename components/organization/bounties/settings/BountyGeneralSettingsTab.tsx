'use client';

import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BoundlessButton } from '@/components/buttons';
import { api } from '@/lib/api/api';
import { bountyKeys, useBounty, type BountyPublic } from '@/features/bounties';
import {
  BOUNTY_CATEGORIES,
  CATEGORY_LABELS,
  type BountyCategory,
} from '@/components/organization/bounties/new/tabs/schemas/scopeSchema';

const generalSchema = z.object({
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
  category: z.enum(BOUNTY_CATEGORIES),
  country: z.string().trim().max(100).optional(),
  githubIssueUrl: z
    .string()
    .trim()
    .url('Enter a valid URL')
    .or(z.literal(''))
    .optional(),
  submissionVisibility: z.enum(['ORGANIZER_ONLY', 'HIDDEN_UNTIL_DEADLINE']),
  documentation: z.boolean(),
  tweet: z.boolean(),
  demoVideo: z.boolean(),
  media: z.boolean(),
  reputationMinimum: z.union([z.number().int().min(0), z.nan()]).optional(),
  maxApplicants: z.union([z.number().int().min(1), z.nan()]).optional(),
  shortlistSize: z.union([z.number().int().min(1), z.nan()]).optional(),
});

type GeneralFormValues = z.infer<typeof generalSchema>;

const inputClassName =
  'h-12 w-full rounded-xl border border-zinc-700 bg-zinc-900/80 p-4 text-white placeholder:text-zinc-500 focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/30';

const REQUIREMENTS: Array<{
  name: 'documentation' | 'tweet' | 'demoVideo' | 'media';
  label: string;
  hint: string;
}> = [
  {
    name: 'documentation',
    label: 'Documentation',
    hint: 'A docs or write-up link is required.',
  },
  { name: 'tweet', label: 'Tweet', hint: 'A tweet/X post link is required.' },
  {
    name: 'demoVideo',
    label: 'Demo video',
    hint: 'A demo video link is required.',
  },
  { name: 'media', label: 'Media', hint: 'At least one image is required.' },
];

/** Empty / NaN number field -> null; otherwise the number. */
function numOrNull(v: number | undefined): number | null {
  return v == null || Number.isNaN(v) ? null : v;
}

/**
 * Editable off-chain settings for a published bounty, covering every off-chain
 * field from the Configure wizard: scope (title / description / category) and
 * submission + application controls (visibility, required fields, reputation,
 * application window, applicant / shortlist limits). On-chain values (rewards,
 * prize tiers, escrow deadline) and the mode are immutable after funding and
 * live in the read-only Reward / Timeline tabs. Saving hits the organizer
 * off-chain PATCH endpoint (tracked in boundless-nestjs#373).
 */
export default function BountyGeneralSettingsTab({
  organizationId,
  bountyId,
}: {
  organizationId: string;
  bountyId: string;
}) {
  const { data: bounty, isLoading } = useBounty(bountyId);

  if (isLoading || !bounty) {
    return (
      <div className='flex min-h-[30vh] items-center justify-center'>
        <Loader2 className='h-6 w-6 animate-spin text-zinc-500' />
      </div>
    );
  }

  return (
    <GeneralForm
      organizationId={organizationId}
      bountyId={bountyId}
      bounty={bounty}
    />
  );
}

function GeneralForm({
  organizationId,
  bountyId,
  bounty,
}: {
  organizationId: string;
  bountyId: string;
  bounty: BountyPublic;
}) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const isApplication =
    bounty.entryType === 'APPLICATION_LIGHT' ||
    bounty.entryType === 'APPLICATION_FULL';
  const isCompetition = bounty.claimType === 'COMPETITION';
  const isOpenSingle =
    bounty.entryType === 'OPEN' && bounty.claimType === 'SINGLE_CLAIM';

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<GeneralFormValues>({
    resolver: zodResolver(generalSchema),
    defaultValues: {
      title: bounty.title,
      description: bounty.description,
      category: BOUNTY_CATEGORIES.includes(bounty.category as BountyCategory)
        ? (bounty.category as BountyCategory)
        : 'DEVELOPMENT',
      country: bounty.country ?? '',
      githubIssueUrl: bounty.githubIssueUrl ?? '',
      submissionVisibility: bounty.submissionVisibility,
      documentation: bounty.submissionRequirements.documentation,
      tweet: bounty.submissionRequirements.tweet,
      demoVideo: bounty.submissionRequirements.demoVideo,
      media: bounty.submissionRequirements.media,
      reputationMinimum: bounty.reputationMinimum ?? undefined,
      maxApplicants: bounty.maxApplicants ?? undefined,
      shortlistSize: bounty.shortlistSize ?? undefined,
    },
  });

  const onSubmit = async (values: GeneralFormValues) => {
    setSaving(true);
    try {
      await api.patch(`/organizations/${organizationId}/bounties/${bountyId}`, {
        title: values.title,
        description: values.description,
        category: values.category,
        country: values.country?.trim() ? values.country.trim() : null,
        githubIssueUrl: values.githubIssueUrl?.trim()
          ? values.githubIssueUrl.trim()
          : null,
        submissionVisibility: values.submissionVisibility,
        submissionRequirements: {
          documentation: values.documentation,
          tweet: values.tweet,
          demoVideo: values.demoVideo,
          media: values.media,
        },
        reputationMinimum: isOpenSingle
          ? numOrNull(values.reputationMinimum)
          : undefined,
        maxApplicants:
          isApplication || (bounty.entryType === 'OPEN' && isCompetition)
            ? numOrNull(values.maxApplicants)
            : undefined,
        shortlistSize: isCompetition
          ? numOrNull(values.shortlistSize)
          : undefined,
      });
      toast.success('Bounty settings saved.');
      void queryClient.invalidateQueries({
        queryKey: bountyKeys.detail(bountyId),
      });
      void queryClient.invalidateQueries({
        queryKey: bountyKeys.overview(organizationId, bountyId),
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to save settings';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const showMaxApplicants =
    isApplication || (bounty.entryType === 'OPEN' && isCompetition);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-8'>
      {/* ── Scope ── */}
      <Section
        title='Scope'
        description="The bounty's identity and discipline."
      >
        <Field label='Title' required error={errors.title?.message}>
          <Input
            {...register('title')}
            placeholder='Bounty title'
            className={inputClassName}
          />
        </Field>

        <Field label='Description' required error={errors.description?.message}>
          <Textarea
            {...register('description')}
            rows={8}
            placeholder='Describe the work, scope, and acceptance criteria (markdown supported).'
            className='focus-visible:border-primary/50 focus-visible:ring-primary/30 w-full rounded-xl border border-zinc-700 bg-zinc-900/80 p-4 text-white placeholder:text-zinc-500 focus-visible:ring-2'
          />
        </Field>

        <Field label='Category'>
          <Controller
            control={control}
            name='category'
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className='border-zinc-700 bg-zinc-900/80 text-white'>
                  <SelectValue placeholder='Choose a category' />
                </SelectTrigger>
                <SelectContent className='border-zinc-800 bg-zinc-900 text-white'>
                  {BOUNTY_CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        <Field label='GitHub issue URL' error={errors.githubIssueUrl?.message}>
          <Input
            {...register('githubIssueUrl')}
            placeholder='https://github.com/org/repo/issues/1'
            className={inputClassName}
          />
        </Field>

        <Field label='Country / region' error={errors.country?.message}>
          <Input
            {...register('country')}
            placeholder='e.g. Nigeria (leave blank for global)'
            className={inputClassName}
          />
        </Field>
      </Section>

      {/* ── Submissions & applications ── */}
      <Section
        title='Submissions & applications'
        description='Who can enter and what each submission must include.'
      >
        <Field label='Submission visibility'>
          <Controller
            control={control}
            name='submissionVisibility'
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className='border-zinc-700 bg-zinc-900/80 text-white'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className='border-zinc-800 bg-zinc-900 text-white'>
                  <SelectItem value='ORGANIZER_ONLY'>Organizer only</SelectItem>
                  <SelectItem value='HIDDEN_UNTIL_DEADLINE'>
                    Hidden until deadline
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        <div className='space-y-2'>
          <p className='text-sm font-medium text-zinc-200'>
            Required submission fields
          </p>
          <div className='space-y-2'>
            {REQUIREMENTS.map(req => (
              <div
                key={req.name}
                className='flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3'
              >
                <div>
                  <p className='text-sm font-medium text-white'>{req.label}</p>
                  <p className='text-xs text-zinc-500'>{req.hint}</p>
                </div>
                <Controller
                  control={control}
                  name={req.name}
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
            ))}
          </div>
        </div>

        {isOpenSingle && (
          <Field
            label='Minimum reputation'
            error={errors.reputationMinimum?.message}
          >
            <Input
              type='number'
              min={0}
              {...register('reputationMinimum', { valueAsNumber: true })}
              placeholder='0'
              className={inputClassName}
            />
          </Field>
        )}

        {showMaxApplicants && (
          <Field label='Max applicants' error={errors.maxApplicants?.message}>
            <Input
              type='number'
              min={1}
              {...register('maxApplicants', { valueAsNumber: true })}
              placeholder='No limit'
              className={inputClassName}
            />
          </Field>
        )}

        {isCompetition && (
          <Field label='Shortlist size' error={errors.shortlistSize?.message}>
            <Input
              type='number'
              min={1}
              {...register('shortlistSize', { valueAsNumber: true })}
              placeholder='Shortlist size'
              className={inputClassName}
            />
          </Field>
        )}
      </Section>

      <div className='flex justify-end'>
        <BoundlessButton type='submit' size='lg' disabled={saving || !isDirty}>
          {saving ? (
            <>
              <Loader2 className='h-4 w-4 animate-spin' />
              Saving…
            </>
          ) : (
            'Save changes'
          )}
        </BoundlessButton>
      </div>
    </form>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className='rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6'>
      <div className='mb-5'>
        <h2 className='text-lg font-semibold text-white'>{title}</h2>
        <p className='mt-1 text-sm text-zinc-400'>{description}</p>
      </div>
      <div className='space-y-5'>{children}</div>
    </section>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className='space-y-2'>
      <label className='text-sm font-medium text-zinc-200'>
        {label}
        {required && <span className='text-red-400'> *</span>}
      </label>
      {children}
      {error && <p className='text-xs text-red-400'>{error}</p>}
    </div>
  );
}
