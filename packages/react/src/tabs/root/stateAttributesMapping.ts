import type { TabsRoot } from './TabsRoot';
import type { StateAttributesMapping } from '../../utils/mapStateAttributes';
import { TabsRootDataAttributes } from './TabsRootDataAttributes';

export const tabsMapping: StateAttributesMapping<TabsRoot.State> = {
  tabActivationDirection: (dir) => ({
    [TabsRootDataAttributes.activationDirection]: dir,
  }),
};
