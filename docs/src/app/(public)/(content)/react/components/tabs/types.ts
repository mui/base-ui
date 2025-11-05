import { Tabs } from '@base-ui-components/react/tabs';
import { createMultipleTypes } from 'docs/src/utils/createTypes';

const types = createMultipleTypes(import.meta.url, Tabs);

export const TypesTabsRoot = types.Root;
export const TypesTabsList = types.List;
export const TypesTabsTab = types.Tab;
export const TypesTabsIndicator = types.Indicator;
export const TypesTabsPanel = types.Panel;
