import { TabsListOwnerState } from './TabsList.types';
import { useTabsRootStyleHooks } from '../Root/useTabsRootStyleHooks';

/**
 * @ignore - internal hook.
 */
export function useTabsListStyleHooks(ownerState: TabsListOwnerState) {
  return useTabsRootStyleHooks(ownerState);
}
