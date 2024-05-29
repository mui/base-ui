import * as React from 'react';
import { SwitchOwnerState } from './SwitchRoot.types';
import { getStyleHookProps } from '../../utils/getStyleHookProps';

/**
 * @ignore - internal hook.
 */
export function useSwitchStyleHooks(ownerState: SwitchOwnerState) {
  return React.useMemo(() => {
    return getStyleHookProps(ownerState, {
      checked: (value) => ({ 'data-state': value ? 'checked' : 'unchecked' }),
    });
  }, [ownerState]);
}
