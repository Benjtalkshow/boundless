'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  CheckCircle2,
  ExternalLink,
  EyeOff,
  FileText,
  Github,
  Loader2,
  PlaySquare,
  Star,
  Trophy,
  Twitter,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { BoundlessButton } from '@/components/buttons';
import EmptyState from '@/components/EmptyState';
import { DueCountdown } from '@/components/bounties/DueCountdown';
import {
  useBountySubmissions,
  type OrganizerBountySubmission,
} from '@/features/bounties';

const STATUS_CLASS: Record<string, string> = {
  pending: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
  accepted: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  rejected: 'border-red-500/30 bg-red-500/10 text-red-400',
  disputed: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function BountySubmissionsPanel({
  organizationId,
  bountyId,
  submissionVisibility,
  submissionDeadline,
}: {
  organizationId: string;
  bountyId: string;
  submissionVisibility: string;
  submissionDeadline: string | null;
}) {
  const [staged, setStaged] = useState<Set<string>>(new Set());

  const deadlinePassed = submissionDeadline
    ? new Date(submissionDeadline).getTime() <= Date.now()
    : false;
  // Competition submissions stay hidden until the deadline so the organizer
  // cannot play favorites mid-flight.
  const gated =
    submissionVisibility === 'HIDDEN_UNTIL_DEADLINE' && !deadlinePassed;

  // Don't even fetch sealed competition work until the deadline.
  const { data, isLoading, error } = useBountySubmissions(
    organizationId,
    bountyId,
    {},
    { enabled: !gated }
  );

  if (gated) {
    return (
      <div className='rounded-2xl border border-zinc-800 bg-zinc-900/40 py-16 text-center'>
        <EyeOff className='mx-auto mb-3 h-6 w-6 text-zinc-500' />
        <p className='text-sm font-medium text-zinc-200'>
          Submissions are hidden until the deadline
        </p>
        <p className='mt-1 text-xs text-zinc-500'>
          This is a competition. Work stays sealed so review stays fair.
        </p>
        {submissionDeadline && (
          <div className='mt-3 flex justify-center'>
            <DueCountdown
              deadline={submissionDeadline}
              className='flex items-center gap-1.5 text-xs font-medium text-zinc-300'
            />
          </div>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-16'>
        <Loader2 className='h-5 w-5 animate-spin text-zinc-500' />
      </div>
    );
  }

  if (error) {
    return (
      <div className='py-12'>
        <EmptyState
          title="Couldn't load submissions"
          description='Try again in a moment.'
          type='compact'
        />
      </div>
    );
  }

  const submissions = data?.items ?? [];

  if (submissions.length === 0) {
    return (
      <div className='py-12'>
        <EmptyState
          title='No submissions yet'
          description='Submitted work will appear here for review.'
          type='compact'
        />
      </div>
    );
  }

  const toggleStage = (id: string) =>
    setStaged(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className='space-y-4'>
      {staged.size > 0 && (
        <div className='border-primary/30 bg-primary/10 flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm'>
          <Trophy className='text-primary h-4 w-4' />
          <span className='text-zinc-200'>{staged.size} staged for payout</span>
          <span className='text-xs text-zinc-500'>
            (winner selection + signing lands in #633)
          </span>
        </div>
      )}

      {submissions.map(s => (
        <SubmissionCard
          key={s.id}
          submission={s}
          staged={staged.has(s.id)}
          onToggleStage={() => toggleStage(s.id)}
        />
      ))}
    </div>
  );
}

function SubmissionCard({
  submission: s,
  staged,
  onToggleStage,
}: {
  submission: OrganizerBountySubmission;
  staged: boolean;
  onToggleStage: () => void;
}) {
  const user = s.submittedBy;
  const statusClass =
    STATUS_CLASS[s.status] ?? 'border-zinc-700 bg-zinc-800/60 text-zinc-300';
  const awarded = s.tierPosition != null;

  return (
    <div
      className={`rounded-2xl border bg-zinc-900/40 p-5 transition-colors ${
        staged
          ? 'border-primary/40 bg-primary/5'
          : 'border-zinc-800 hover:border-zinc-700'
      }`}
    >
      <div className='flex items-start justify-between gap-3'>
        {/* Submitter */}
        <Link
          href={user.username ? `/profile/${user.username}` : '#'}
          className='group flex items-center gap-2.5'
        >
          <Avatar className='h-8 w-8'>
            <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name} />
            <AvatarFallback className='text-xs'>
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className='group-hover:text-primary text-sm font-medium text-white'>
              {user.name}
            </p>
            {user.username && (
              <p className='text-xs text-zinc-500'>@{user.username}</p>
            )}
          </div>
        </Link>

        <div className='flex items-center gap-2'>
          {awarded && (
            <Badge
              variant='outline'
              className='border-primary/30 bg-primary/10 text-primary flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium'
            >
              <Trophy className='h-3 w-3' />
              {ordinal(s.tierPosition as number)}
              {s.tierAmount
                ? ` · ${Number(s.tierAmount).toLocaleString()}`
                : ''}
            </Badge>
          )}
          <Badge
            variant='outline'
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusClass}`}
          >
            {s.status}
          </Badge>
        </div>
      </div>

      {/* Work links */}
      <div className='mt-4 flex flex-wrap gap-2'>
        {s.contentUri && (
          <LinkChip
            href={s.contentUri}
            icon={<Github className='h-3.5 w-3.5' />}
            label='Submission'
            primary
          />
        )}
        {s.documentationUrl && (
          <LinkChip
            href={s.documentationUrl}
            icon={<FileText className='h-3.5 w-3.5' />}
            label='Docs'
          />
        )}
        {s.tweetUrl && (
          <LinkChip
            href={s.tweetUrl}
            icon={<Twitter className='h-3.5 w-3.5' />}
            label='Tweet'
          />
        )}
        {s.demoVideoUrl && (
          <LinkChip
            href={s.demoVideoUrl}
            icon={<PlaySquare className='h-3.5 w-3.5' />}
            label='Demo'
          />
        )}
      </div>

      {/* Media */}
      {s.mediaUrls.length > 0 && (
        <div className='mt-3 flex flex-wrap gap-2'>
          {s.mediaUrls.map(url => (
            <a
              key={url}
              href={url}
              target='_blank'
              rel='noreferrer'
              className='relative h-16 w-24 overflow-hidden rounded-lg border border-zinc-800'
            >
              <Image
                src={url}
                alt='Submission media'
                fill
                unoptimized
                className='object-cover'
              />
            </a>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className='mt-4 flex items-center justify-between border-t border-zinc-800 pt-3'>
        <span className='text-xs text-zinc-500'>
          Submitted {formatDate(s.createdAt)}
          {s.escrowAnchorStatus && s.escrowAnchorStatus !== 'active' && (
            <span className='ml-2 text-amber-400'>
              ({s.escrowAnchorStatus.replace(/_/g, ' ')})
            </span>
          )}
        </span>
        <BoundlessButton
          variant='outline'
          size='sm'
          onClick={onToggleStage}
          className={staged ? 'border-primary text-primary' : 'text-zinc-300'}
        >
          {staged ? (
            <>
              <CheckCircle2 className='mr-1.5 h-3.5 w-3.5' />
              Staged
            </>
          ) : (
            <>
              <Star className='mr-1.5 h-3.5 w-3.5' />
              Stage for payout
            </>
          )}
        </BoundlessButton>
      </div>
    </div>
  );
}

function LinkChip({
  href,
  icon,
  label,
  primary,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  primary?: boolean;
}) {
  return (
    <a
      href={href}
      target='_blank'
      rel='noreferrer'
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
        primary
          ? 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/20'
          : 'border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:border-zinc-700'
      }`}
    >
      {icon}
      {label}
      <ExternalLink className='h-3 w-3 opacity-60' />
    </a>
  );
}

const ordinal = (n: number): string => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
};
