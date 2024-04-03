import type { BaseUIComponentProps } from '../../utils/BaseUI.types';
import type { TabsDirection, TabsOrientation, TabsOwnerState } from '../Tabs.types';
import type { ActiveTabPosition } from '../../useTabIndicator/useTabIndicator.types';

export type TabIndicatorOwnerState = TabsOwnerState & {
  selectedTabPosition: ActiveTabPosition | null;
  orientation: TabsOrientation;
  direction: TabsDirection;
};

export interface TabIndicatorProps extends BaseUIComponentProps<'span', TabIndicatorOwnerState> {}
