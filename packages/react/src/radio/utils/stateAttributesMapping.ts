import type { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import type { TransitionStatus } from '../../internals/useTransitionStatus';
import { transitionStatusMapping } from '../../internals/stateAttributesMapping';
import { fieldValidityMapping } from '../../internals/field-constants/constants';

export const stateAttributesMapping = {
  checked(value): Record<string, string> {
    // Literals inlined so `RadioRootDataAttributes` tree-shakes out of the
    // bundle; `radio/enumSync.test.ts` guards against drift from the enum.
    if (value) {
      return { 'data-checked': '' };
    }
    return { 'data-unchecked': '' };
  },
  ...transitionStatusMapping,
  ...fieldValidityMapping,
} satisfies StateAttributesMapping<{
  checked: boolean;
  transitionStatus: TransitionStatus;
  valid: boolean | null;
}>;
