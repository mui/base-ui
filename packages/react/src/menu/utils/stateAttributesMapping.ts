import type { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { transitionStatusMapping } from '../../utils/stateAttributesMapping';
import { MenuCheckboxItemDataAttributes } from '../checkbox-item/MenuCheckboxItemDataAttributes';

export const itemMapping: StateAttributesMapping<{ checked: boolean }> = {
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
