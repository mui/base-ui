import * as React from 'react';
import type { TooltipTriggerOwnerState } from './TooltipTrigger.types';
import { getStyleHookProps } from '../../utils/getStyleHookProps';

/**
 * @ignore - internal hook.
 */
export function useTriggerStyleHooks(ownerState: TooltipTriggerOwnerState) {
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
