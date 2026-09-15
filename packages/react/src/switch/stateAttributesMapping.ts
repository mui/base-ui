import type { SwitchRootState } from './root/SwitchRoot';
import type { StateAttributesMapping } from '../internals/getStateAttributesProps';
import { fieldValidityMapping } from '../internals/field-constants/constants';
import * as SwitchRootDataAttributes from './root/SwitchRootDataAttributes';

export const stateAttributesMapping: StateAttributesMapping<SwitchRootState> = {
  ...fieldValidityMapping,
  checked(value): Record<string, string> {
    if (value) {
      return { [SwitchRootDataAttributes.checked]: '' };
    }

    return { [SwitchRootDataAttributes.unchecked]: '' };
  },
};
