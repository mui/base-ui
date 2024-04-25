import * as React from 'react';
import { TabsRootOwnerState } from './TabsRoot.types';
import { getStyleHookProps } from '../../utils/getStyleHookProps';

/**
 * @ignore - internal hook.
 */
export function useTabsStyleHooks(ownerState: TabsRootOwnerState) {
  return React.useMemo(() => {
    return getStyleHookProps(ownerState, {
      direction: () => null,
      tabActivationDirection: (direction) => ({
        'data-activation-direction': direction as string,
      }),
    });
  }, [ownerState]);
}
