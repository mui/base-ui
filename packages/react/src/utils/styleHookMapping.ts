import type { TransitionStatus } from './useTransitionStatus';
import type { CustomStyleHookMapping } from './getStyleHookProps';

const STARTING_HOOK = { 'data-starting-style': '' };
const ENDING_HOOK = { 'data-ending-style': '' };

export const transitionStatusMapping = {
  transitionStatus(value): Record<string, string> | null {
    if (value === 'starting') {
      return STARTING_HOOK;
    }
    if (value === 'ending') {
      return ENDING_HOOK;
    }
    return null;
  },
} satisfies CustomStyleHookMapping<{ transitionStatus: TransitionStatus }>;
