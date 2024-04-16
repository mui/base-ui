import * as React from 'react';
import * as Tabs from '@base_ui/react/Tabs';

export default function UnstyledTabsBasic() {
  return (
    <Tabs.Root defaultValue={1}>
      <Tabs.List>
        <Tabs.Tab value={1}>One</Tabs.Tab>
        <Tabs.Tab value={2}>Two</Tabs.Tab>
        <Tabs.Tab value={3}>Three</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value={1}>First page</Tabs.Panel>
      <Tabs.Panel value={2}>Second page</Tabs.Panel>
      <Tabs.Panel value={3}>Third page</Tabs.Panel>
    </Tabs.Root>
  );
}
