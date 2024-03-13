import * as React from 'react';
import { SwitchOwnerState } from './Switch.types';
import { getStyleHookProps } from '../utils/getStyleHookProps';
/**
 *
 * API:
 *
 * - [useSwitchStyleHooks API](https://mui.com/base-ui/api/use-switch-style-hooks/)
 */
export function useSwitchStyleHooks(ownerState: SwitchOwnerState) {
  return React.useMemo(() => {
    return getStyleHookProps(ownerState, {
      checked: (value) => ({ 'data-state': value ? 'checked' : 'unchecked' }),
    });
  }, [ownerState]);
}
