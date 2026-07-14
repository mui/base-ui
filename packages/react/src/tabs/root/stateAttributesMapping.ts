import type { TabsRootState } from './TabsRoot';
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps';

export const tabsStateAttributesMapping: StateAttributesMapping<TabsRootState> = {
  tabActivationDirection: (dir) => ({
    'data-activation-direction': dir,
  }),
};
