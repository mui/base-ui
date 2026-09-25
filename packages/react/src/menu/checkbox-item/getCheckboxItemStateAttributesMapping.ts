import type { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import { transitionStatusMapping } from '../../internals/stateAttributesMapping';
import * as MenuCheckboxItemDataAttributes from './MenuCheckboxItemDataAttributes';

function getCheckedStateAttributes(value: boolean): Record<string, string> {
  if (value) {
    return {
      [MenuCheckboxItemDataAttributes.checked]: '',
    };
  }
  return {
    [MenuCheckboxItemDataAttributes.unchecked]: '',
  };
}

export function getCheckboxItemStateAttributesMapping(state: {
  checked: boolean;
  indeterminate: boolean;
}): StateAttributesMapping<{ checked: boolean; indeterminate: boolean }> {
  return {
    checked(value): Record<string, string> | null {
      return state.indeterminate ? null : getCheckedStateAttributes(value);
    },
    indeterminate(value): Record<string, string> | null {
      return value ? { [MenuCheckboxItemDataAttributes.indeterminate]: '' } : null;
    },
    ...transitionStatusMapping,
  };
}
