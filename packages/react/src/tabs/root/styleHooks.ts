import type { TabsRoot } from './TabsRoot';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';

export const tabsStyleHookMapping: CustomStyleHookMapping<TabsRoot.State> = {
  tabActivationDirection: (dir) => ({
    'data-activation-direction': dir,
  }),
};
