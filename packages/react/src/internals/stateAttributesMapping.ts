import type { TransitionStatus } from './useTransitionStatus';
import type { StateAttributesMapping } from './getStateAttributesProps';

export enum TransitionStatusDataAttributes {
  /**
   * Present when the component begins animating in.
   */
  startingStyle = 'data-starting-style',
  /**
   * Present when the component is animating out.
   */
  endingStyle = 'data-ending-style',
}

// Literals inlined so `TransitionStatusDataAttributes` tree-shakes out of
// consumer bundles; `stateAttributesMapping.test.ts` guards against drift.
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
} satisfies StateAttributesMapping<{ transitionStatus: TransitionStatus }>;
