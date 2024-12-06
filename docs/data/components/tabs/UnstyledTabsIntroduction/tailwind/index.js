'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { Tabs } from '@base-ui-components/react/tabs';
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

const TabsList = React.forwardRef((props, ref) => {
  const { className, ...other } = props;
  return (
    <Tabs.List
      ref={ref}
      className={clsx(
        'min-w-tabs-list mb-4 flex content-between items-center justify-center rounded-xl bg-gray-500 font-sans shadow-lg',
        className,
      )}
      {...other}
    />
  );
});

TabsList.propTypes = {
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
};

const Tab = React.forwardRef((props, ref) => {
  const { className, ...other } = props;
  return (
    <Tabs.Tab
      ref={ref}
      {...other}
      className={({ selected, disabled }) =>
        clsx(
          `font-sans ${
            selected
              ? 'bg-white text-gray-500'
              : 'bg-transparent text-white hover:bg-gray-400 focus:text-white'
          } ${
            disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
          } focus:shadow-outline-gray-light m-1.5 flex w-full justify-center rounded-md border-0 px-3 py-2.5 text-sm leading-[1.3] font-semibold focus:outline-0`,
          className,
        )
      }
    />
  );
});

Tab.propTypes = {
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
};

const TabPanel = React.forwardRef((props, ref) => {
  const { className, ...other } = props;
  return (
    <Tabs.Panel
      ref={ref}
      className={clsx(
        'w-full rounded-xl border border-solid border-gray-200 bg-white px-3 py-5 font-sans text-sm opacity-60 dark:border-gray-700 dark:bg-gray-900',
        className,
      )}
      {...other}
    />
  );
});

TabPanel.propTypes = {
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
};
