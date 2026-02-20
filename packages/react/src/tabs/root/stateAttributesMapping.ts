import type { TabsRootState } from './TabsRoot';
import type { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { TabsRootDataAttributes } from './TabsRootDataAttributes';

export const tabsStateAttributesMapping: StateAttributesMapping<TabsRootState> = {
  tabActivationDirection: (dir) => ({
    [TabsRootDataAttributes.activationDirection]: dir,
  }),
};
