import * as React from 'react';
import { SwitchOwnerState } from './Switch.types';
import { getStyleHookProps } from '../utils/getStyleHookProps';

export function useSwitchStyleHooks(ownerState: SwitchOwnerState) {
  return React.useMemo(() => {
    return getStyleHookProps(ownerState, {
      checked: (value) => ({ 'data-state': value ? 'checked' : 'unchecked' }),
    });
  }, [ownerState]);
}
