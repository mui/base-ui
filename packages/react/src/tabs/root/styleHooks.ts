import type { TabsRoot } from './TabsRoot';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { TabsRootDataAttributes } from './TabsRootDataAttributes';

export const tabsStyleHookMapping: CustomStyleHookMapping<TabsRoot.State> = {
  tabActivationDirection: (dir) => ({
    [TabsRootDataAttributes.activationDirection]: dir,
  }),
};
