import type { SwitchRootState } from './root/SwitchRoot';
import type { StateAttributesMapping } from '../internals/getStateAttributesProps';
import { fieldValidityMapping } from '../internals/field-constants/constants';

export const stateAttributesMapping: StateAttributesMapping<SwitchRootState> = {
  ...fieldValidityMapping,
  checked(value): Record<string, string> {
    // Literals inlined so `SwitchRootDataAttributes` tree-shakes out of the
    // bundle; `switch/enumSync.test.ts` guards against drift from the enum.
    if (value) {
      return { 'data-checked': '' };
    }

    return { 'data-unchecked': '' };
  },
};
