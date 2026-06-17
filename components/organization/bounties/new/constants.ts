import type { ModeFormData } from './tabs/schemas/modeSchema';
import type { SubmissionModelFormData } from './tabs/schemas/submissionModelSchema';
import type {
  BountyRewardSection,
  BountyScopeSection,
} from '@/features/bounties';

export type StepStatus = 'pending' | 'active' | 'completed';

export type StepKey = 'scope' | 'mode' | 'submission' | 'reward' | 'review';

export interface StepData {
  status: StepStatus;
  isCompleted: boolean;
  data?: Record<string, unknown>;
}

/** The five wizard steps, in order. `review` carries no editable section. */
export const STEP_ORDER: StepKey[] = [
  'scope',
  'mode',
  'submission',
  'reward',
  'review',
];

/**
 * In-progress wizard form snapshot. The four editable sections use the #599
 * form schemas where they exist (mode, submission) and the generated section
 * types otherwise (scope, reward — refined by the dedicated tabs in #600).
 */
export interface BountyFormData {
  scope?: BountyScopeSection;
  mode?: ModeFormData;
  submission?: SubmissionModelFormData;
  reward?: BountyRewardSection;
}

/**
 * Does a step hold enough data to count as complete? Drives the tab badges and
 * the resume "first incomplete step" computation. Never a navigation gate
 * (navigation is free-roam); real validation happens on save + at publish.
 */
export const isBountyStepDataValid = (
  stepKey: StepKey,
  formData: BountyFormData
): boolean => {
  switch (stepKey) {
    case 'scope': {
      const scope = formData.scope;
      return !!(scope?.title?.trim() && scope?.description?.trim());
    }
    case 'mode': {
      const mode = formData.mode;
      return !!(mode?.entryType && mode?.claimType);
    }
    case 'submission': {
      return !!formData.submission?.submissionDeadline;
    }
    case 'reward': {
      const reward = formData.reward;
      return !!(
        reward?.rewardCurrency && (reward?.prizeTiers?.length ?? 0) > 0
      );
    }
    case 'review':
      return false;
    default:
      return false;
  }
};
