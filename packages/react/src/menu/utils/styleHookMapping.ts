import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import { MenuCheckboxItemDataAttributes } from '../checkbox-item/MenuCheckboxItemDataAttributes';

export const itemMapping: CustomStyleHookMapping<{ checked: boolean }> = {
  checked(value): Record<string, string> {
    if (value) {
      return {
        [MenuCheckboxItemDataAttributes.checked]: '',
      };
    }
    return {
      [MenuCheckboxItemDataAttributes.unchecked]: '',
    };
  },
  ...transitionStatusMapping,
};
