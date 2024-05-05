import * as React from 'react';
import { TabIndicatorOwnerState } from './TabIndicator.types';
import { getStyleHookProps } from '../../utils/getStyleHookProps';

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
      tabActivationDirection: (direction) => ({
        'data-activation-direction': direction as string,
      }),
    });
  }, [ownerState]);
}
