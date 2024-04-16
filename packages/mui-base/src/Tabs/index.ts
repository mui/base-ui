export { Tabs as Root } from './Tabs';
export type {
  TabsRootOwnerState as RootOwnerState,
  TabsRootProps as RootProps,
  TabsDirection as Direction,
  TabsOrientation as Orientation,
} from './Tabs.types';

export { Tab } from './Tab/Tab';
export type { TabOwnerState, TabProps } from './Tab/Tab.types';

export { TabIndicator as Indicator } from './TabIndicator/TabIndicator';
export type {
  TabIndicatorOwnerState as IndicatorOwnerState,
  TabIndicatorProps as IndicatorProps,
} from './TabIndicator/TabIndicator.types';

export { TabPanel as Panel } from './TabPanel/TabPanel';
export type {
  TabPanelOwnerState as PanelOwnerState,
  TabPanelProps as PanelProps,
} from './TabPanel/TabPanel.types';

export { TabsList as List } from './TabsList/TabsList';
export type {
  TabsListOwnerState as ListOwnerState,
  TabsListProps as ListProps,
} from './TabsList/TabsList.types';
