import * as React from 'react';
import { TabProps, Tabs, TabsListProps } from '@base_ui/react/Tabs';

export default function UnstyledTabsCustomized() {
  return (
    <Tabs defaultValue={1}>
      <TabsList>
        <Tab value={1}>One</Tab>
        <Tab value={2}>Two</Tab>
        <Tab value={3}>Three</Tab>
      </TabsList>
      <Tabs.Panel className="w-full font-sans text-sm" value={1}>
        First page
      </Tabs.Panel>
      <Tabs.Panel className="w-full font-sans text-sm" value={2}>
        Second page
      </Tabs.Panel>
      <Tabs.Panel className="w-full font-sans text-sm" value={3}>
        Third page
      </Tabs.Panel>
    </Tabs>
  );
}

const TabsList = React.forwardRef(function TabsList(
  props: TabsListProps,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  return (
    <Tabs.List
      ref={ref}
      {...props}
      className="mb-4 rounded-xl bg-purple-500 flex font-sans items-center justify-center content-between min-w-tabs-list shadow-lg"
    />
  );
});

const Tab = React.forwardRef(function Tab(
  props: TabProps,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  return (
    <Tabs.Tab
      ref={ref}
      {...props}
      className={({ selected, disabled }) =>
        `font-sans ${
          selected
            ? 'text-purple-500 bg-white'
            : 'text-white bg-transparent focus:text-white hover:bg-purple-400'
        } ${
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
        } text-sm font-bold w-full p-2 m-1.5 border-0 rounded-md flex justify-center focus:outline-0 focus:shadow-outline-purple-light`
      }
    />
  );
});
