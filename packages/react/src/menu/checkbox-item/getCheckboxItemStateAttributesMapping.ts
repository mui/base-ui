import type { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import { itemMapping } from '../utils/stateAttributesMapping';

export function getCheckboxItemStateAttributesMapping(state: {
  checked: boolean;
  indeterminate: boolean;
}): StateAttributesMapping<{ checked: boolean; indeterminate: boolean }> {
  return {
    ...itemMapping,
    checked: (value) => (state.indeterminate ? null : itemMapping.checked!(value)),
  };
}
