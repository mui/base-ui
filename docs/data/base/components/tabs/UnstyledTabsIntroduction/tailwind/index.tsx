'use client';

import * as React from 'react';
import clsx from 'clsx';
import * as Tabs from '@base_ui/react/Tabs';
import { useTheme } from '@mui/system';

function useIsDarkMode() {
  const theme = useTheme();
  return theme.palette.mode === 'dark';
}

export default function UnstyledTabsIntroduction() {
  // Replace this with your app logic for determining dark mode
  const isDarkMode = useIsDarkMode();

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <Tabs.Root defaultValue={0}>
        <TabsList aria-label="Settings">
          <Tab value={0}>My account</Tab>
          <Tab value={1}>Profile</Tab>
          <Tab value={2}>Language</Tab>
        </TabsList>
        <TabPanel value={0}>My account page</TabPanel>
        <TabPanel value={1}>Profile page</TabPanel>
        <TabPanel value={2}>Language page</TabPanel>
      </Tabs.Root>
    </div>
  );
}

const TabsList = React.forwardRef<HTMLDivElement, Tabs.ListProps>((props, ref) => {
  const { className, ...other } = props;
  return (
    <Tabs.List
      ref={ref}
      className={clsx(
        'mb-4 rounded-xl bg-purple-500 flex font-sans items-center justify-center content-between min-w-tabs-list shadow-lg',
        className,
      )}
      {...other}
    />
  );
});

const Tab = React.forwardRef<HTMLButtonElement, Tabs.TabProps>((props, ref) => {
  const { className, ...other } = props;
  return (
    <Tabs.Tab
      ref={ref}
      {...other}
      className={({ selected, disabled }) =>
        clsx(
          `font-sans ${
            selected
              ? 'text-purple-500 bg-white'
              : 'text-white bg-transparent focus:text-white hover:bg-purple-400'
          } ${
            disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
          } text-sm leading-[1.3] font-semibold w-full py-2.5 px-3 m-1.5 border-0 rounded-md flex justify-center focus:outline-0 focus:shadow-outline-purple-light`,
          className,
        )
      }
    />
  );
});

const TabPanel = React.forwardRef<HTMLDivElement, Tabs.PanelProps>((props, ref) => {
  const { className, ...other } = props;
  return (
    <Tabs.Panel
      ref={ref}
      className={clsx(
        'py-5 px-3 bg-white dark:bg-slate-900 border border-solid border-slate-200 dark:border-slate-700 rounded-xl opacity-60 w-full font-sans text-sm',
        className,
      )}
      {...other}
    />
  );
});
