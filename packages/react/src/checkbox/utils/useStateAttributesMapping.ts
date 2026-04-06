'use client';
import * as React from 'react';
import type { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import type { CheckboxRootState } from '../root/CheckboxRoot';
import { CheckboxRootDataAttributes } from '../root/CheckboxRootDataAttributes';
import { fieldValidityMapping } from '../../field/utils/constants';

export function useStateAttributesMapping(state: CheckboxRootState) {
  return React.useMemo<StateAttributesMapping<typeof state>>(
    () => ({
      checked(value): Record<string, string> {
        if (state.indeterminate) {
          // `data-indeterminate` is already handled by the `indeterminate` prop.
          return {};
        }

        if (value) {
          return {
            [CheckboxRootDataAttributes.checked]: '',
          };
        }

        return {
          [CheckboxRootDataAttributes.unchecked]: '',
        };
      },
      ...fieldValidityMapping,
    }),
    [state.indeterminate],
  );
}
