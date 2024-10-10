import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';

export const radioItemMapping: CustomStyleHookMapping<{ checked: boolean }> = {
  checked(value): Record<string, string> {
    if (value) {
      return {
        'data-radio-item-checked': '',
      };
    }
    return {
      'data-radio-item-unchecked': '',
    };
  },
};

export const checkboxItemMapping: CustomStyleHookMapping<{ checked: boolean }> = {
  checked(value): Record<string, string> {
    if (value) {
      return {
        'data-checkbox-item-checked': '',
      };
    }
    return {
      'data-checkbox-item-unchecked': '',
    };
  },
};
