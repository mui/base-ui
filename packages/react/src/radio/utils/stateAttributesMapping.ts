import type { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { transitionStatusMapping } from '../../utils/stateAttributesMapping';
import { fieldValidityMapping } from '../../field/utils/constants';
import { RadioRootDataAttributes } from '../root/RadioRootDataAttributes';

export const stateAttributesMapping = {
  checked(value): Record<string, string> {
    if (value) {
      return { [RadioRootDataAttributes.checked]: '' };
    }
    return { [RadioRootDataAttributes.unchecked]: '' };
  },
  ...transitionStatusMapping,
  ...fieldValidityMapping,
} satisfies StateAttributesMapping<{
  checked: boolean;
  transitionStatus: TransitionStatus;
  valid: boolean | null;
}>;
