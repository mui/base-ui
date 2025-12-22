import type { TabsRoot } from './TabsRoot';
import type { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { TabsRootDataAttributes } from './TabsRootDataAttributes';

export const tabsStateAttributesMapping: StateAttributesMapping<TabsRoot.State> = {
  tabActivationDirection: (dir) => ({
    [TabsRootDataAttributes.activationDirection]: dir,
  }),
};
