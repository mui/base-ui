import type { SwitchRoot } from './Root/SwitchRoot';
import type { CustomStyleHookMapping } from '../utils/getStyleHookProps';

export const styleHookMapping: CustomStyleHookMapping<SwitchRoot.State> = {
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
