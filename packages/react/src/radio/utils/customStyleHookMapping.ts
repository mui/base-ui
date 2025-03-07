import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import { fieldValidityMapping } from '../../field/utils/constants';

export const customStyleHookMapping = {
  checked(value): Record<string, string> {
    if (value) {
      return { 'data-checked': '' };
    }
    return { 'data-unchecked': '' };
  },
  ...transitionStatusMapping,
  ...fieldValidityMapping,
} satisfies CustomStyleHookMapping<{
  checked: boolean;
  transitionStatus: TransitionStatus;
  valid: boolean | null;
}>;
