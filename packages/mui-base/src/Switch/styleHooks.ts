import type { SwitchRoot } from './Root/SwitchRoot.js';
import type { CustomStyleHookMapping } from '../utils/getStyleHookProps.js';

export const styleHookMapping: CustomStyleHookMapping<SwitchRoot.OwnerState> = {
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
