'use client';

import { Loader2, Lock } from 'lucide-react';

import { useBounty, type BountyPublic } from '@/features/bounties';
import {
  computeBountyModeLabel,
  type BountyClaimType,
  type BountyEntryType,
} from '@/components/organization/bounties/new/tabs/schemas/modeSchema';

/** Read-only plain-language descriptions of the entry / claim axes. */
const ENTRY_INFO: Record<BountyEntryType, { label: string; hint: string }> = {
  OPEN: { label: 'Open', hint: 'Anyone can start working right away.' },
  APPLICATION_LIGHT: {
    label: 'Application (light)',
    hint: 'A short application before work begins.',
  },
  APPLICATION_FULL: {
    label: 'Application (full)',
    hint: 'A full application and review before work begins.',
  },
};

const CLAIM_INFO: Record<BountyClaimType, { label: string; hint: string }> = {
  SINGLE_CLAIM: {
    label: 'Single claim',
    hint: 'One contributor works exclusively and is paid.',
  },
  COMPETITION: {
    label: 'Competition',
    hint: 'Several work in parallel; the best win.',
  },
};

/**
 * Read-only view of how the bounty was set up: its mode (entry x claim) and the
 * organizer-supplied resources. These choices are anchored at publish and can
 * never be changed here, so they are shown for context but never editable. The
 * editable off-chain fields live in the General tab.
 */
export default function BountyConfigurationTab({
  bountyId,
}: {
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

  return <ConfigurationView bounty={bounty} />;
}

function ConfigurationView({ bounty }: { bounty: BountyPublic }) {
  const entryInfo = bounty.entryType
    ? ENTRY_INFO[bounty.entryType as BountyEntryType]
    : undefined;
  const claimInfo = bounty.claimType
    ? CLAIM_INFO[bounty.claimType as BountyClaimType]
    : undefined;
  const resources = bounty.resources ?? [];

  return (
    <div className='space-y-4'>
      <div className='flex items-start gap-2.5 rounded-xl border border-zinc-800 bg-zinc-900/30 p-3.5 text-sm text-zinc-400'>
        <Lock className='mt-0.5 h-4 w-4 shrink-0 text-zinc-500' />
        <span>
          How this bounty was set up. These choices are fixed once the bounty is
          published and cannot be changed here.
        </span>
      </div>

      {/* ── Mode ── */}
      <Section
        title='Mode'
        description='The entry and claim rules chosen when the bounty was created.'
      >
        <ReadField
          label='Mode'
          value={
            bounty.entryType && bounty.claimType
              ? computeBountyModeLabel(
                  bounty.entryType as BountyEntryType,
                  bounty.claimType as BountyClaimType
                )
              : 'Bounty'
          }
        />
        {entryInfo && (
          <ReadField
            label='How do contributors enter?'
            value={entryInfo.label}
            hint={entryInfo.hint}
          />
        )}
        {claimInfo && (
          <ReadField
            label='How is the work claimed?'
            value={claimInfo.label}
            hint={claimInfo.hint}
          />
        )}
      </Section>

      {/* ── Resources ── */}
      <Section
        title='Resources'
        description='Links and files shared with contributors, set in the Configure wizard.'
      >
        {resources.length === 0 ? (
          <p className='text-sm text-zinc-500'>No resources were added.</p>
        ) : (
          <ul className='space-y-2'>
            {resources.map((resource, i) => {
              const href = resource.link || resource.file?.url;
              const label =
                resource.description ||
                resource.file?.name ||
                resource.link ||
                'Resource';
              return (
                <li
                  key={resource.id ?? i}
                  className='rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm'
                >
                  {href ? (
                    <a
                      href={href}
                      target='_blank'
                      rel='noreferrer'
                      className='text-primary hover:underline'
                    >
                      {label}
                    </a>
                  ) : (
                    <span className='text-white'>{label}</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </div>
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

function ReadField({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className='space-y-1'>
      <p className='text-sm font-medium text-zinc-200'>{label}</p>
      <div className='rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-white'>
        {value}
        {hint && <p className='mt-0.5 text-xs text-zinc-400'>{hint}</p>}
      </div>
    </div>
  );
}
