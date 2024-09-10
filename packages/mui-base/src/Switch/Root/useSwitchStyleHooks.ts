import * as React from 'react';
import type { SwitchRoot } from './SwitchRoot';
import { getStyleHookProps } from '../../utils/getStyleHookProps';

/**
 * @ignore - internal hook.
 */
export function useSwitchStyleHooks(ownerState: SwitchRoot.OwnerState) {
  return React.useMemo(() => {
    return getStyleHookProps(ownerState, {
      checked: (value) => ({ 'data-state': value ? 'checked' : 'unchecked' }),
    });
  }, [ownerState]);
}
