import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { transitionStatusMapping } from '../../utils/styleHookMapping';

export const customStyleHookMapping = {
  checked(value): Record<string, string> {
    if (value) {
      return { 'data-checked': '' };
    }
    return { 'data-unchecked': '' };
  },
  ...transitionStatusMapping,
} satisfies CustomStyleHookMapping<{
  checked: boolean;
  transitionStatus: TransitionStatus;
}>;
