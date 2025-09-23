import type { SwitchRoot } from './root/SwitchRoot';
import type { StateAttributesMapping } from '../utils/getStateAttributesProps';
import { fieldValidityMapping } from '../field/utils/constants';
import { SwitchRootDataAttributes } from './root/SwitchRootDataAttributes';

export const stateAttributesMapping: StateAttributesMapping<SwitchRoot.State> = {
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
