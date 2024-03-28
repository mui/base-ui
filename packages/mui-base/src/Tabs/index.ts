import { combineComponentExports } from '../utils/combineComponentExports';
import { Tabs as TabsRoot } from './Tabs';
import { Tab } from './Tab';
import { TabsList } from './TabsList';
import { TabPanel } from './TabPanel';
import { TabsBubble } from './Bubble';

export * from './TabsContext';

export * from './Tabs.types';
export * from './Tab/Tab.types';
export * from './TabsList/TabsList.types';
export * from './TabPanel/TabPanel.types';
export * from './Bubble/Bubble.types';

export const Tabs = combineComponentExports(TabsRoot, {
  Tab,
  List: TabsList,
  Panel: TabPanel,
  Bubble: TabsBubble,
});
