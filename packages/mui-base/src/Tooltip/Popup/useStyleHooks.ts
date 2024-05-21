import * as React from 'react';
import type { TooltipPopupOwnerState } from './TooltipPopup.types';
import { getStyleHookProps } from '../../utils/getStyleHookProps';

/**
 * @ignore - internal hook.
 */
export function useStyleHooks(ownerState: TooltipPopupOwnerState) {
  return React.useMemo(() => {
    return getStyleHookProps(ownerState, {
      open(value) {
        return {
          'data-state': value ? 'open' : 'closed',
        };
      },
    });
  }, [ownerState]);
}
