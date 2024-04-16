import * as React from 'react';
import { TabsRootOwnerState } from './Tabs.types';
import { getStyleHookProps } from '../utils/getStyleHookProps';

/**
 * @ignore - internal hook.
 */
export function useTabsStyleHooks(ownerState: TabsRootOwnerState) {
  return React.useMemo(() => {
    return getStyleHookProps(ownerState, {
      direction: () => null,
    });
  }, [ownerState]);
}
