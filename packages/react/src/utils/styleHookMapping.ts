import type { TransitionStatus } from './useTransitionStatus';
import type { CustomStyleHookMapping } from './getStyleHookProps';

export const transitionStatusMapping = {
  transitionStatus(value): Record<string, string> | null {
    if (value === 'entering') {
      return { 'data-starting-style': '' };
    }
    if (value === 'exiting') {
      return { 'data-ending-style': '' };
    }
    return null;
  },
} satisfies CustomStyleHookMapping<{ transitionStatus: TransitionStatus }>;
