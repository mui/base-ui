import type { TransitionStatus } from './useTransitionStatus';
import type { StateAttributesMapping } from './getStateAttributesProps';
import * as TransitionStatusDataAttributes from './TransitionStatusDataAttributes';

export { TransitionStatusDataAttributes };

const STARTING_HOOK = { [TransitionStatusDataAttributes.startingStyle]: '' };
const ENDING_HOOK = { [TransitionStatusDataAttributes.endingStyle]: '' };

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
} satisfies StateAttributesMapping<{ transitionStatus: TransitionStatus }>;
