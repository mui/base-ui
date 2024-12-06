'use client';
import * as React from 'react';
import { Menu } from '@base-ui-components/react/menu';
import { useTheme } from '@mui/system';

function useIsDarkMode() {
  const theme = useTheme();
  return theme.palette.mode === 'dark';
}

export default function MenuIntroduction() {
  // Replace this with your app logic for determining dark mode
  const isDarkMode = useIsDarkMode();

  const createHandleMenuClick = (menuItem) => {
    return () => {
      console.log(`Clicked on ${menuItem}`);
    };
  };

  return (
    <div className={`${isDarkMode ? 'dark' : ''}`}>
      <Menu.Root>
        <MenuButton>My account</MenuButton>
        <MenuPositioner>
          <MenuPopup>
            <Menu.Group>
              <MenuGroupLabel>Settings</MenuGroupLabel>
              <MenuItem onClick={createHandleMenuClick('Profile')}>Profile</MenuItem>
              <MenuItem onClick={createHandleMenuClick('Language settings')}>
                Language settings
              </MenuItem>
            </Menu.Group>
            <MenuSeparator />
            <MenuItem onClick={createHandleMenuClick('Log out')}>Log out</MenuItem>
          </MenuPopup>
        </MenuPositioner>
      </Menu.Root>
    </div>
  );
}

const MenuPopup = React.forwardRef((props, ref) => {
  const classes = `
    text-sm box-border font-sans p-1.5 my-3 mx-0 rounded-xl overflow-auto outline-0
    bg-white dark:bg-gray-900 border border-solid border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-300
    min-w-listbox shadow-md dark:shadow-gray-900
    [.open_&]:opacity-100 [.open_&]:scale-100 [.closed_&]:opacity-0 [.closed_&]:scale-90
    transition-[opacity,transform]  [.placement-top_&]:origin-bottom [.placement-bottom_&]:origin-top`;

  return <Menu.Popup ref={ref} {...props} className={classes} />;
});

const MenuButton = React.forwardRef((props, ref) => {
  const classes = `
    cursor-pointer text-sm font-sans box-border rounded-lg font-semibold px-4 py-2 bg-white dark:bg-gray-900
    border border-solid border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-200 hover:bg-gray-50 hover:dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600
    focus-visible:shadow-[0_0_0_4px_#ddd6fe] dark:focus-visible:shadow-[0_0_0_4px_#a78bfa] focus-visible:outline-none shadow-sm
  `;

  return <Menu.Trigger ref={ref} className={classes} {...props} />;
});

const MenuItem = React.forwardRef((props, ref) => {
  const classes = `
    list-none p-2 rounded-lg cursor-default select-none last-of-type:border-b-0 focus:shadow-outline-gray
    focus:outline-0 focus:bg-gray-100 focus:dark:bg-gray-800 focus:text-gray-900 focus:dark:text-gray-300 disabled:text-gray-400 disabled:dark:text-gray-700 disabled:hover:text-gray-400 disabled:hover:dark:text-gray-700
  `;
  return <Menu.Item ref={ref} className={classes} {...props} />;
});

const MenuPositioner = React.forwardRef((props, ref) => {
  return (
    <Menu.Positioner
      ref={ref}
      className="closed:pointer-events-none focus-visible:outline-0"
      {...props}
    />
  );
});

const MenuSeparator = React.forwardRef((props, ref) => {
  return (
    <Menu.Separator
      ref={ref}
      className="my-2 border-t border-solid border-gray-200 dark:border-gray-700"
      {...props}
    />
  );
});

const MenuGroupLabel = React.forwardRef((props, ref) => {
  return (
    <Menu.GroupLabel
      ref={ref}
      className="p-2 font-sans text-xs font-semibold text-gray-700 uppercase select-none dark:text-gray-200"
      {...props}
    />
  );
});
