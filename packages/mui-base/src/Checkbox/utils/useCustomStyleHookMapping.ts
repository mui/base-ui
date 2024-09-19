'use client';
import * as React from 'react';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import type { CheckboxRoot } from '../Root/CheckboxRoot';

export function useCustomStyleHookMapping(ownerState: CheckboxRoot.OwnerState) {
  return React.useMemo<CustomStyleHookMapping<typeof ownerState>>(
    () => ({
      // `data-state="mixed"` is used to style the checkbox when it's indeterminate
      indeterminate: () => null,
      checked(value) {
        let state = value ? 'checked' : 'unchecked';
        if (ownerState.indeterminate) {
          state = 'mixed';
        }

        return {
          'data-state': state,
        };
      },
    }),
    [ownerState.indeterminate],
  );
}
