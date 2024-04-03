import * as React from 'react';
import type { OwnerState } from './Tooltip.types';
import { getStyleHookProps } from '../utils/getStyleHookProps';

export function useTooltipStyleHooks(ownerState: OwnerState) {
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
