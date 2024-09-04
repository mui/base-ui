'use client';

import * as React from 'react';
import type { CheckboxRootOwnerState } from './Root/CheckboxRoot.types';
import { getStyleHookProps } from '../utils/getStyleHookProps';

export function useCheckboxStyleHooks(ownerState: CheckboxRootOwnerState) {
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
