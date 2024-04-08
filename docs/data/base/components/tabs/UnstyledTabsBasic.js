import * as React from 'react';
import { Tabs } from '@base_ui/react/Tabs';
import { TabsList } from '@base_ui/react/TabsList';
import { TabPanel } from '@base_ui/react/TabPanel';
import { Tab } from '@base_ui/react/Tab';

export default function UnstyledTabsBasic() {
  return (
    <Tabs defaultValue={1}>
      <TabsList>
        <Tab value={1}>One</Tab>
        <Tab value={2}>Two</Tab>
        <Tab value={3}>Three</Tab>
      </TabsList>
      <TabPanel value={1}>First page</TabPanel>
      <TabPanel value={2}>Second page</TabPanel>
      <TabPanel value={3}>Third page</TabPanel>
    </Tabs>
  );
}
