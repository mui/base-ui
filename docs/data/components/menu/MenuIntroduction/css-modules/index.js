'use client';
import * as React from 'react';
import {
  Menu,
  MenuItems,
  MenuItem,
  MenuTrigger,
  MenuSeparator,
  MenuGroup,
} from './Menu';

export default function MenuIntroduction() {
  const createHandleMenuClick = (menuItem) => {
    return () => {
      console.log(`Clicked on ${menuItem}`);
    };
  };

  return (
    <Menu>
      <MenuTrigger>My account</MenuTrigger>

      <MenuItems>
        <MenuGroup>
          <MenuItem onClick={createHandleMenuClick('Profile')}>Profile</MenuItem>
          <MenuItem onClick={createHandleMenuClick('Language settings')}>
            Language settings
          </MenuItem>
        </MenuGroup>
        <MenuSeparator />
        <MenuItem onClick={createHandleMenuClick('Log out')}>Log out</MenuItem>
      </MenuItems>
    </Menu>
  );
}
