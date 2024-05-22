import * as React from 'react';
import type { TooltipPopupOwnerState } from './TooltipPopup.types';
import { getStyleHookProps } from '../../utils/getStyleHookProps';

/**
 * @ignore - internal hook.
 */
export function useStyleHooks(ownerState: TooltipPopupOwnerState) {
  return React.useMemo(() => {
    return getStyleHookProps(ownerState, {
      entering(value) {
        return value ? { 'data-entering': '' } : null;
      },
      exiting(value) {
        return value ? { 'data-exiting': '' } : null;
      },
      open(value) {
        return {
          'data-state': value ? 'open' : 'closed',
        };
      },
    });
  }, [ownerState]);
}
