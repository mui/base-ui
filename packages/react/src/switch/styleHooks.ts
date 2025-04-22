import type { SwitchRoot } from './root/SwitchRoot';
import type { CustomStyleHookMapping } from '../utils/getStyleHookProps';
import { fieldValidityMapping } from '../field/utils/constants';
import { SwitchRootDataAttributes } from './root/SwitchRootDataAttributes';

export const styleHookMapping: CustomStyleHookMapping<SwitchRoot.State> = {
  ...fieldValidityMapping,
  checked(value): Record<string, string> {
    if (value) {
      return {
        [SwitchRootDataAttributes.checked]: '',
      };
    }

    return {
      [SwitchRootDataAttributes.unchecked]: '',
    };
  },
};
