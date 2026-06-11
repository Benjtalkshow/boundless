'use client';

import { useCallback, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type {
  StepKey,
  StepData,
  StepStatus,
} from '@/components/organization/hackathons/new/constants';
import { STEP_ORDER } from '@/components/organization/hackathons/new/constants';

interface UseHackathonStepsReturn {
  activeTab: StepKey;
  steps: Record<StepKey, StepData>;
  setActiveTab: (tab: StepKey) => void;
  setStepsFromDraft: (
    steps: Record<StepKey, StepData>,
    activeStep: StepKey
  ) => void;
  navigateToStep: (stepKey: StepKey, skipAccessCheck?: boolean) => void;
  canAccessStep: (stepKey: StepKey) => boolean;
  updateStepCompletion: (
    stepKey: StepKey,
    isCompleted: boolean,
    nextStep?: StepKey
  ) => void;
}

function isStepKey(value: string | null | undefined): value is StepKey {
  return !!value && (STEP_ORDER as readonly string[]).includes(value);
}

/**
 * Wizard step state. The active step is URL-driven via the `?step=` query param,
 * so refresh, browser back/forward, and bookmarking all resume the right step.
 * The per-step status map (active/completed/pending) stays local UI state.
 */
export const useHackathonSteps = (
  initialActiveTab: StepKey = 'information'
): UseHackathonStepsReturn => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlStep = searchParams.get('step');
  const activeTab: StepKey = isStepKey(urlStep) ? urlStep : initialActiveTab;

  const [steps, setSteps] = useState<Record<StepKey, StepData>>({
    information: { status: 'active', isCompleted: false },
    timeline: { status: 'pending', isCompleted: false },
    participation: { status: 'pending', isCompleted: false },
    rewards: { status: 'pending', isCompleted: false },
    resources: { status: 'pending', isCompleted: false },
    judging: { status: 'pending', isCompleted: false },
    collaboration: { status: 'pending', isCompleted: false },
    review: { status: 'pending', isCompleted: false },
  });

  // Write the active step to the URL. `push` for explicit navigation (so the
  // back button steps through), `replace` for programmatic syncs (auto-resume).
  const writeStep = useCallback(
    (stepKey: StepKey, mode: 'push' | 'replace' = 'push') => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('step', stepKey);
      const url = `${pathname}?${params.toString()}`;
      if (mode === 'replace') router.replace(url, { scroll: false });
      else router.push(url, { scroll: false });
    },
    [searchParams, pathname, router]
  );

  const setActiveTab = useCallback(
    (tab: StepKey) => writeStep(tab, 'push'),
    [writeStep]
  );

  const getCurrentStepIndex = useCallback(
    () => STEP_ORDER.indexOf(activeTab),
    [activeTab]
  );

  const canAccessStep = useCallback(
    (stepKey: StepKey) => {
      if (stepKey === 'review') {
        return steps.collaboration?.isCompleted === true;
      }

      const stepIndex = STEP_ORDER.indexOf(stepKey);
      const currentIndex = getCurrentStepIndex();

      if (stepIndex <= currentIndex) return true;

      if (stepIndex === currentIndex + 1 && steps[activeTab].isCompleted) {
        return true;
      }

      return false;
    },
    [steps, activeTab, getCurrentStepIndex]
  );

  const navigateToStep = useCallback(
    (stepKey: StepKey, skipAccessCheck = false) => {
      if (skipAccessCheck || canAccessStep(stepKey)) {
        const stepIndex = STEP_ORDER.indexOf(stepKey);
        const currentIndex = getCurrentStepIndex();

        if (stepIndex > currentIndex) {
          setSteps(prev => {
            const newSteps = { ...prev };

            STEP_ORDER.forEach((step, index) => {
              if (index > stepIndex) {
                newSteps[step] = { status: 'pending', isCompleted: false };
              }
            });

            newSteps[stepKey] = { ...newSteps[stepKey], status: 'active' };

            return newSteps;
          });
        } else {
          setSteps(prev => ({
            ...prev,
            [stepKey]: { ...prev[stepKey], status: 'active' },
          }));
        }

        writeStep(stepKey, 'push');
      }
    },
    [canAccessStep, getCurrentStepIndex, writeStep]
  );

  const setStepsFromDraft = useCallback(
    (stepsState: Record<StepKey, StepData>, activeStep: StepKey) => {
      setSteps(stepsState);
      // Respect an explicit ?step= in the URL (a refresh / bookmark). Only fall
      // back to the computed first-incomplete step when the URL has none, and
      // do it as a replace so auto-resume doesn't add a history entry.
      if (!isStepKey(searchParams.get('step'))) {
        writeStep(activeStep, 'replace');
      }
    },
    [searchParams, writeStep]
  );

  const updateStepCompletion = useCallback(
    (stepKey: StepKey, isCompleted: boolean, nextStep?: StepKey) => {
      setSteps(prev => {
        const newSteps: Record<StepKey, StepData> = {
          ...prev,
          [stepKey]: {
            ...prev[stepKey],
            status: 'completed' as StepStatus,
            isCompleted,
          },
        };

        if (nextStep) {
          newSteps[nextStep] = {
            ...prev[nextStep],
            status: 'active' as StepStatus,
          };
        }

        return newSteps;
      });

      if (nextStep) {
        writeStep(nextStep, 'push');
      }
    },
    [writeStep]
  );

  return {
    activeTab,
    steps,
    setActiveTab,
    setStepsFromDraft,
    navigateToStep,
    canAccessStep,
    updateStepCompletion,
  };
};
