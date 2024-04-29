import { TabPanelOwnerState } from './TabPanel.types';
import { useTabsRootStyleHooks } from '../Root/useTabsRootStyleHooks';

/**
 * @ignore - internal hook.
 */
export function useTabPanelStyleHooks(ownerState: TabPanelOwnerState) {
  return useTabsRootStyleHooks(ownerState);
}
