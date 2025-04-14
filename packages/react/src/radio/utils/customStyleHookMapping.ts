import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import { fieldValidityMapping } from '../../field/utils/constants';
import { RadioRootDataAttributes } from '../root/RadioRootDataAttributes';

export const customStyleHookMapping = {
  checked(value): Record<string, string> {
    if (value) {
      return { [RadioRootDataAttributes.checked]: '' };
    }
    return { [RadioRootDataAttributes.unchecked]: '' };
  },
  ...transitionStatusMapping,
  ...fieldValidityMapping,
} satisfies CustomStyleHookMapping<{
  checked: boolean;
  transitionStatus: TransitionStatus;
  valid: boolean | null;
}>;
