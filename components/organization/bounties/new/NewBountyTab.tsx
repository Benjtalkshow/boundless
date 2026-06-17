'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

import { Tabs, TabsContent } from '@/components/ui/tabs';
import { BoundlessButton } from '@/components/buttons';
import { useBountySteps } from '@/hooks/use-bounty-steps';
import { useBountyDraft } from '@/hooks/use-bounty-draft';
import ModeTab from './tabs/ModeTab';
import SubmissionModelTab from './tabs/SubmissionModelTab';
import type { ModeSelection } from './tabs/schemas/modeSchema';
import {
  BountyFormData,
  STEP_ORDER,
  isBountyStepDataValid,
  type StepData,
  type StepKey,
} from './constants';

interface NewBountyTabProps {
  organizationId?: string;
  draftId?: string;
}

/** Placeholder for a wizard section whose tab lands in #600 (Scope / Reward). */
function SectionPlaceholder({
  title,
  description,
  onContinue,
}: {
  title: string;
  description: string;
  onContinue?: () => void;
}) {
  return (
    <div className='space-y-6'>
      <div className='rounded-lg border border-dashed border-zinc-800 bg-zinc-900/30 p-6'>
        <h3 className='text-sm font-medium text-white'>{title}</h3>
        <p className='mt-1 text-sm text-zinc-500'>{description}</p>
      </div>
      {onContinue && (
        <div className='flex justify-end'>
          <BoundlessButton type='button' size='lg' onClick={onContinue}>
            Continue
          </BoundlessButton>
        </div>
      )}
    </div>
  );
}

/**
 * Bounty Configure wizard orchestrator. Wires the step navigation (URL-driven),
 * the draft state (lazy create + per-section PATCH + resume), and the section
 * tabs. The ModeTab feeds the chosen mode into the SubmissionModelTab so its
 * conditional fields render correctly.
 *
 * Scope / Reward / Review tabs arrive in #600 and the publish + funding flow in
 * #601; their wiring seams (saveSection, draftId, navigateToStep) are in place
 * here. There are intentionally no AI entry points.
 */
export default function NewBountyTab({
  organizationId,
  draftId: initialDraftId,
}: NewBountyTabProps) {
  const derivedOrgId = useMemo(() => {
    if (organizationId) return organizationId;
    if (typeof window !== 'undefined') {
      const parts = window.location.pathname.split('/');
      if (parts.length >= 3 && parts[1] === 'organizations') return parts[2];
    }
    return undefined;
  }, [organizationId]);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // draftId arrives via the route path (/drafts/[draftId]) or, on /new, via a
  // ?draftId= we add after the first save. Either resumes the same draft.
  const resolvedInitialDraftId =
    initialDraftId ?? searchParams.get('draftId') ?? undefined;

  const { activeTab, navigateToStep, setStepsFromDraft, updateStepCompletion } =
    useBountySteps('scope');

  const onDraftLoadedRef = useRef<
    ((formData: BountyFormData, firstIncompleteStep: StepKey) => void) | null
  >(null);

  const {
    draftId,
    stepData,
    setStepData,
    isLoadingDraft,
    currentError,
    isSavingDraft,
    saveDraft,
    saveStep,
  } = useBountyDraft({
    organizationId: derivedOrgId,
    initialDraftId: resolvedInitialDraftId,
    onDraftLoaded: (formData, firstIncompleteStep) => {
      onDraftLoadedRef.current?.(formData, firstIncompleteStep);
    },
  });

  // Persist a freshly-created draft id into the URL so a refresh resumes it.
  useEffect(() => {
    if (!draftId || initialDraftId) return;
    if (searchParams.get('draftId') === draftId) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('draftId', draftId);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [draftId, initialDraftId, searchParams, pathname, router]);

  const onDraftLoaded = useCallback(
    (formData: BountyFormData, firstIncompleteStep: StepKey) => {
      setStepData(formData);
      const activeIndex = STEP_ORDER.indexOf(firstIncompleteStep);
      const newSteps = {} as Record<StepKey, StepData>;
      STEP_ORDER.forEach((key, index) => {
        const isCompleted = isBountyStepDataValid(key, formData);
        if (index < activeIndex) {
          newSteps[key] = { status: 'completed', isCompleted: true };
        } else if (index === activeIndex) {
          newSteps[key] = { status: 'active', isCompleted };
        } else {
          newSteps[key] = {
            status: 'pending',
            isCompleted: key === 'review' ? false : isCompleted,
          };
        }
      });
      setStepsFromDraft(newSteps, firstIncompleteStep);
    },
    [setStepData, setStepsFromDraft]
  );

  useEffect(() => {
    onDraftLoadedRef.current = onDraftLoaded;
  }, [onDraftLoaded]);

  // Per-step save: persist the section, mark it complete, and advance.
  const [loadingStates, setLoadingStates] = useState<Record<StepKey, boolean>>({
    scope: false,
    mode: false,
    submission: false,
    reward: false,
    review: false,
  });

  const createSaveHandler = useCallback(
    <T,>(stepKey: StepKey, nextStep: StepKey) =>
      async (data: T) => {
        if (!derivedOrgId) {
          toast.error('Organization ID is required');
          return;
        }
        setLoadingStates(prev => ({ ...prev, [stepKey]: true }));
        try {
          await saveStep(
            stepKey,
            data as NonNullable<BountyFormData[keyof BountyFormData]>
          );
          updateStepCompletion(stepKey, true, nextStep);
        } catch {
          throw new Error(`Failed to save ${stepKey} step`);
        } finally {
          setLoadingStates(prev => ({ ...prev, [stepKey]: false }));
        }
      },
    [derivedOrgId, saveStep, updateStepCompletion]
  );

  const modeSelection: ModeSelection | undefined = stepData.mode
    ? { entryType: stepData.mode.entryType, claimType: stepData.mode.claimType }
    : undefined;

  if (isLoadingDraft) {
    return (
      <div className='bg-background-main-bg flex min-h-[60vh] flex-1 items-center justify-center text-white'>
        <div className='flex flex-col items-center gap-4'>
          <div className='border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent' />
          <span className='text-sm text-gray-400'>Loading draft...</span>
        </div>
      </div>
    );
  }

  if (currentError) {
    return (
      <div className='bg-background-main-bg flex min-h-[60vh] flex-1 items-center justify-center text-white'>
        <span className='text-sm text-red-400'>{currentError}</span>
      </div>
    );
  }

  return (
    <div
      className='bg-background-main-bg mx-auto max-w-6xl flex-1 overflow-hidden px-6 py-8 text-white'
      id={organizationId}
    >
      <Tabs value={activeTab} className='w-full'>
        <div className='px-6 py-6 md:px-20'>
          <TabsContent value='scope' className='mt-0'>
            {/* TODO(#600): replace with ScopeTab (title/description/github/...). */}
            <SectionPlaceholder
              title='Scope'
              description='The Scope tab (title, description, GitHub issue) lands in #600.'
              onContinue={() => navigateToStep('mode')}
            />
          </TabsContent>

          <TabsContent value='mode' className='mt-0'>
            <ModeTab
              onSave={createSaveHandler('mode', 'submission')}
              onContinue={() => navigateToStep('submission')}
              initialData={stepData.mode}
              isLoading={loadingStates.mode}
            />
          </TabsContent>

          <TabsContent value='submission' className='mt-0'>
            <SubmissionModelTab
              mode={modeSelection}
              onSave={createSaveHandler('submission', 'reward')}
              onContinue={() => navigateToStep('reward')}
              initialData={stepData.submission}
              isLoading={loadingStates.submission}
            />
          </TabsContent>

          <TabsContent value='reward' className='mt-0'>
            {/* TODO(#600): replace with RewardTab (currency + prize tiers). */}
            <SectionPlaceholder
              title='Reward'
              description='The Reward tab (currency + prize tiers) lands in #600.'
              onContinue={() => navigateToStep('review')}
            />
          </TabsContent>

          <TabsContent value='review' className='mt-0'>
            {/* TODO(#600/#601): replace with ReviewTab + publish/funding flow. */}
            <div className='space-y-6'>
              <div className='rounded-lg border border-dashed border-zinc-800 bg-zinc-900/30 p-6'>
                <h3 className='text-sm font-medium text-white'>
                  Review &amp; publish
                </h3>
                <p className='mt-1 text-sm text-zinc-500'>
                  The review summary and the publish + funding flow land in #600
                  / #601.
                </p>
              </div>
              <div className='flex justify-end gap-3'>
                <BoundlessButton
                  type='button'
                  variant='outline'
                  size='lg'
                  onClick={saveDraft}
                  disabled={isSavingDraft}
                >
                  {isSavingDraft ? 'Saving...' : 'Save draft'}
                </BoundlessButton>
                <BoundlessButton type='button' size='lg' disabled>
                  Publish (coming in #601)
                </BoundlessButton>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
