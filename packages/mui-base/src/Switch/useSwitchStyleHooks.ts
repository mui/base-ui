import * as React from 'react';
import { OwnerState } from './Switch.types';
import { getStyleHookProps } from '../utils/getStyleHookProps';

/**
 * @ignore - internal hook.
 */
export function useSwitchStyleHooks(ownerState: OwnerState) {
  return React.useMemo(() => {
    return getStyleHookProps(ownerState, {
      checked: (value) => ({ 'data-state': value ? 'checked' : 'unchecked' }),
    });
  }, [ownerState]);
}
