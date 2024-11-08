import type { TabsRoot } from './TabsRoot.js';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps.js';

export const tabsStyleHookMapping: CustomStyleHookMapping<TabsRoot.OwnerState> = {
  direction: () => null,
  tabActivationDirection: (dir) => ({
    'data-activation-direction': dir,
  }),
};
