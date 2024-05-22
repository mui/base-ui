import type { TabsRootOwnerState } from './TabsRoot.types';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';

export const tabsStyleHookMapping: CustomStyleHookMapping<TabsRootOwnerState> = {
  direction: () => null,
  tabActivationDirection: (dir) => ({
    'data-activation-direction': dir,
  }),
};
