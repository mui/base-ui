'use client';
import * as React from 'react';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import type { CheckboxRoot } from '../Root/CheckboxRoot';

export function useCustomStyleHookMapping(ownerState: CheckboxRoot.OwnerState) {
  return React.useMemo<CustomStyleHookMapping<typeof ownerState>>(
    () => ({
      checked(value): Record<string, string> {
        if (ownerState.indeterminate) {
          // `data-indeterminate` is already handled by the `indeterminate` prop.
          return {};
        }

        if (value) {
          return {
            'data-checked': '',
          };
        }

        return {
          'data-unchecked': '',
        };
      },
    }),
    [ownerState.indeterminate],
  );
}
