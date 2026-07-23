import type { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import type { CheckboxRootState } from '../root/CheckboxRoot';
import { fieldValidityMapping } from '../../internals/field-constants/constants';
import * as CheckboxRootDataAttributes from '../root/CheckboxRootDataAttributes';

export function getCheckboxStateAttributesMapping(
  state: CheckboxRootState,
): StateAttributesMapping<CheckboxRootState> {
  return {
    checked(value): Record<string, string> {
      if (state.indeterminate) {
        // `data-indeterminate` is already handled by the `indeterminate` prop.
        return {};
      }

      if (value) {
        return { [CheckboxRootDataAttributes.checked]: '' };
      }

      return { [CheckboxRootDataAttributes.unchecked]: '' };
    },
    ...fieldValidityMapping,
  };
}
