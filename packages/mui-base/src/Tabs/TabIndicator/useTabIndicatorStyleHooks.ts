import * as React from 'react';
import { TabIndicatorOwnerState } from './TabIndicator.types';
import { getStyleHookProps } from '../../utils/getStyleHookProps';
import { TabSelectionMovementDirection } from '../../useTabIndicator/useTabIndicator.types';

// eslint-disable-next-line react/function-component-definition
const NOOP = () => null;

/**
 * @ignore - internal hook.
 */
export function useTabIndicatorStyleHooks(ownerState: TabIndicatorOwnerState) {
  return React.useMemo(() => {
    // @ts-ignore The non-stringifyable value of the ownerState is excluded below
    return getStyleHookProps(ownerState, {
      direction: NOOP,
      selectedTabPosition: NOOP,
      movementDirection: (direction: TabSelectionMovementDirection) => {
        if (direction === 0) {
          return { 'data-movement-direction': 'none' };
        }

        return { 'data-movement-direction': direction === 1 ? 'next' : 'previous' };
      },
    });
  }, [ownerState]);
}
