'use client';
import * as React from 'react';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import type { CheckboxRoot } from '../root/CheckboxRoot';

export function useCustomStyleHookMapping(state: CheckboxRoot.State) {
  return React.useMemo<CustomStyleHookMapping<typeof state>>(
    () => ({
      checked(value): Record<string, string> {
        if (state.indeterminate) {
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
    [state.indeterminate],
  );
}
