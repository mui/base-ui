import * as React from 'react';
import { getStyleHookProps } from '../utils/getStyleHookProps';
import type { CheckboxOwnerState } from './Checkbox.types';

export function useCheckboxStyleHooks(ownerState: CheckboxOwnerState) {
  return React.useMemo(() => {
    return getStyleHookProps(ownerState, {
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
    });
  }, [ownerState]);
}
