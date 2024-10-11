import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';

export const itemMapping: CustomStyleHookMapping<{ checked: boolean }> = {
  checked(value): Record<string, string> {
    if (value) {
      return {
        'data-checked': '',
      };
    }
    return {
      'data-unchecked': '',
    };
  },
};
