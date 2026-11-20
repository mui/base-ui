import { EMPTY_OBJECT } from '@base-ui/utils/empty';
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import type { CheckboxRootState } from '../root/CheckboxRoot';
import { fieldValidityMapping } from '../../internals/field-constants/constants';
import { mapCheckedStateAttribute } from '../../internals/stateAttributesMapping';

export function getCheckboxStateAttributesMapping(
  state: CheckboxRootState,
): StateAttributesMapping<CheckboxRootState> {
  return {
    // `data-indeterminate` is already handled by the `indeterminate` prop.
    checked: (value) => (state.indeterminate ? EMPTY_OBJECT : mapCheckedStateAttribute(value)),
    ...fieldValidityMapping,
  };
}
