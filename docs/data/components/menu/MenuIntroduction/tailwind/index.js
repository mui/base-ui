'use client';

import * as React from 'react';
import * as Menu from '@base_ui/react/Menu';
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
            <Menu.Group.Root>
              <MenuGroupLabel>Settings</MenuGroupLabel>
              <MenuItem onClick={createHandleMenuClick('Profile')}>Profile</MenuItem>
              <MenuItem onClick={createHandleMenuClick('Language settings')}>
                Language settings
              </MenuItem>
            </Menu.Group.Root>
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
    bg-white dark:bg-slate-900 border border-solid border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-300
    min-w-listbox shadow-md dark:shadow-slate-900
    [.open_&]:opacity-100 [.open_&]:scale-100 [.closed_&]:opacity-0 [.closed_&]:scale-90
    transition-[opacity,transform]  [.placement-top_&]:origin-bottom [.placement-bottom_&]:origin-top`;

  return <Menu.Popup ref={ref} {...props} className={classes} />;
});

const MenuButton = React.forwardRef((props, ref) => {
  const classes = `
    cursor-pointer text-sm font-sans box-border rounded-lg font-semibold px-4 py-2 bg-white dark:bg-slate-900
    border border-solid border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 hover:bg-slate-50 hover:dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600
    focus-visible:shadow-[0_0_0_4px_#ddd6fe] dark:focus-visible:shadow-[0_0_0_4px_#a78bfa] focus-visible:outline-none shadow-sm
  `;

  return <Menu.Trigger ref={ref} className={classes} {...props} />;
});

const MenuItem = React.forwardRef((props, ref) => {
  const classes = `
    list-none p-2 rounded-lg cursor-default select-none last-of-type:border-b-0 focus:shadow-outline-purple
    focus:outline-0 focus:bg-slate-100 focus:dark:bg-slate-800 focus:text-slate-900 focus:dark:text-slate-300 disabled:text-slate-400 disabled:dark:text-slate-700 disabled:hover:text-slate-400 disabled:hover:dark:text-slate-700
  `;
  return <Menu.Item ref={ref} className={classes} {...props} />;
});

const MenuPositioner = React.forwardRef((props, ref) => {
  return (
    <Menu.Positioner
      ref={ref}
      className="focus-visible:outline-0 closed:pointer-events-none"
      {...props}
    />
  );
});

const MenuSeparator = React.forwardRef((props, ref) => {
  return (
    <Menu.Separator
      ref={ref}
      className="border-t border-solid border-slate-200 dark:border-slate-700 my-2"
      {...props}
    />
  );
});

const MenuGroupLabel = React.forwardRef((props, ref) => {
  return (
    <Menu.Group.Label
      ref={ref}
      className="text-xs font-sans font-semibold text-slate-900 dark:text-slate-300 my-2"
      {...props}
    />
  );
});
