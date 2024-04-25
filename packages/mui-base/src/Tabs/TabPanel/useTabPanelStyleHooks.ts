import * as React from 'react';
import { TabPanelOwnerState } from './TabPanel.types';
import { getStyleHookProps } from '../../utils/getStyleHookProps';

/**
 * @ignore - internal hook.
 */
export function useTabPanelStyleHooks(ownerState: TabPanelOwnerState) {
  return React.useMemo(() => {
    return getStyleHookProps(ownerState, {
      direction: () => null,
    });
  }, [ownerState]);
}
