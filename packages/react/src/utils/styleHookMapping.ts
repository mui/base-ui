import type { TransitionStatus } from './useTransitionStatus';
import type { CustomStyleHookMapping } from './getStyleHookProps';

export const transitionStatusMapping = {
  transitionStatus(value): Record<string, string> | null {
    if (value === 'starting') {
      return { 'data-starting-style': '' };
    }
    if (value === 'ending') {
      return { 'data-ending-style': '' };
    }
    return null;
  },
} satisfies CustomStyleHookMapping<{ transitionStatus: TransitionStatus }>;
