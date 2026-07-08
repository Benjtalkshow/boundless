'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Loader2, Lock } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

import { Input } from '@/components/ui/input';
import { BoundlessButton } from '@/components/buttons';
import { api } from '@/lib/api/api';
import { bountyKeys, useBounty, type BountyPublic } from '@/features/bounties';

const inputClassName =
  'h-12 w-full rounded-xl border border-zinc-700 bg-zinc-900/80 p-4 text-white placeholder:text-zinc-500 focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/30';

/** ISO date-time -> value for <input type="datetime-local"> (local time). */
function toLocalInput(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDate(iso?: string | null): string {
  if (!iso) return 'Not set';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? 'Not set'
    : d.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
}

/**
 * Timeline settings. The submission deadline is anchored on-chain at publish
 * and is read-only. The application window close is off-chain (enforced by a
 * backend cron), so it is editable here for application-mode bounties.
 */
export default function BountyTimelineSettingsTab({
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
    <TimelineForm
      organizationId={organizationId}
      bountyId={bountyId}
      bounty={bounty}
    />
  );
}

function TimelineForm({
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

  const {
    register,
    handleSubmit,
    formState: { isDirty },
  } = useForm<{ applicationWindowCloseAt: string }>({
    defaultValues: {
      applicationWindowCloseAt: toLocalInput(bounty.applicationWindowCloseAt),
    },
  });

  const onSubmit = async (values: { applicationWindowCloseAt: string }) => {
    setSaving(true);
    try {
      await api.patch(`/organizations/${organizationId}/bounties/${bountyId}`, {
        applicationWindowCloseAt: values.applicationWindowCloseAt
          ? new Date(values.applicationWindowCloseAt).toISOString()
          : null,
      });
      toast.success('Timeline saved.');
      void queryClient.invalidateQueries({
        queryKey: bountyKeys.detail(bountyId),
      });
      void queryClient.invalidateQueries({
        queryKey: bountyKeys.overview(organizationId, bountyId),
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to save timeline';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='space-y-4'>
      {/* Submission deadline — on-chain, read-only. */}
      <div className='rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5'>
        <div className='flex items-start justify-between gap-4'>
          <div>
            <h3 className='text-sm font-semibold text-white'>
              Submission deadline
            </h3>
            <p className='mt-1 text-sm text-zinc-400'>
              {formatDate(bounty.submissionDeadline)}
            </p>
          </div>
          <span className='flex shrink-0 items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 text-xs text-zinc-400'>
            <Lock className='h-3 w-3' />
            On-chain
          </span>
        </div>
        <p className='mt-3 border-t border-zinc-800 pt-3 text-xs text-zinc-500'>
          Anchored in the escrow at publish; it can&apos;t be changed after
          funding.
        </p>
      </div>

      {/* Application window close — off-chain, editable (application modes). */}
      {isApplication ? (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className='rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6'
        >
          <div className='mb-4'>
            <h3 className='text-sm font-semibold text-white'>
              Applications close
            </h3>
            <p className='mt-1 text-sm text-zinc-400'>
              When the application window closes. Off-chain, so you can adjust
              it any time before it passes.
            </p>
          </div>
          <Input
            type='datetime-local'
            {...register('applicationWindowCloseAt')}
            className={inputClassName}
          />
          <div className='mt-5 flex justify-end'>
            <BoundlessButton
              type='submit'
              size='lg'
              disabled={saving || !isDirty}
            >
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
      ) : (
        <div className='rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 text-sm text-zinc-500'>
          This bounty has no application window — builders submit directly.
        </div>
      )}
    </div>
  );
}
