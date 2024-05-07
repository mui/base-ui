import * as React from 'react';
import type { TooltipContentOwnerState } from './TooltipContent.types';
import { getStyleHookProps } from '../../utils/getStyleHookProps';

/**
 * @ignore - internal hook.
 */
export function useContentStyleHooks(ownerState: TooltipContentOwnerState) {
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
