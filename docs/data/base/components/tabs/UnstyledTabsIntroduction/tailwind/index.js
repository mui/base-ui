import * as React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { Tabs } from '@base_ui/react/Tabs';
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
      <Tabs defaultValue={0}>
        <TabsList>
          <Tab value={0}>My account</Tab>
          <Tab value={1}>Profile</Tab>
          <Tab value={2}>Language</Tab>
        </TabsList>
        <TabPanel value={0}>My account page</TabPanel>
        <TabPanel value={1}>Profile page</TabPanel>
        <TabPanel value={2}>Language page</TabPanel>
      </Tabs>
    </div>
  );
}

const TabsList = React.forwardRef((props, ref) => {
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
        'py-5 px-3 bg-white dark:bg-slate-900 border border-solid border-slate-200 dark:border-slate-700 rounded-xl opacity-60 w-full font-sans text-sm',
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
