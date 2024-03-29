import * as React from 'react';
import { TabsListOwnerState } from './TabsList.types';
import { getStyleHookProps } from '../../utils/getStyleHookProps';

/**
 * @ignore - internal hook.
 */
export function useTabsListStyleHooks(ownerState: TabsListOwnerState) {
  return React.useMemo(() => {
    return getStyleHookProps(ownerState, {
      direction: () => null,
    });
  }, [ownerState]);
}
