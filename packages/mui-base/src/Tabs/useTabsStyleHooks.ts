import * as React from 'react';
import { TabsOwnerState } from './Tabs.types';
import { getStyleHookProps } from '../utils/getStyleHookProps';

/**
 * @ignore - internal hook.
 */
export function useTabsStyleHooks(ownerState: TabsOwnerState) {
  return React.useMemo(() => {
    return getStyleHookProps(ownerState);
  }, [ownerState]);
}
