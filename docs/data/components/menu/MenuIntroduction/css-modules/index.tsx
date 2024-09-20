'use client';
import * as React from 'react';
import { Menu, MenuItems, MenuItem, MenuTrigger } from './Menu';

export default function MenuIntroduction() {
  const createHandleMenuClick = (menuItem: string) => {
    return () => {
      console.log(`Clicked on ${menuItem}`);
    };
  };

  return (
    <Menu>
      <MenuTrigger>My account</MenuTrigger>

      <MenuItems>
        <MenuItem onClick={createHandleMenuClick('Profile')}>Profile</MenuItem>
        <MenuItem onClick={createHandleMenuClick('Language settings')}>
          Language settings
        </MenuItem>
        <MenuItem onClick={createHandleMenuClick('Log out')}>Log out</MenuItem>
      </MenuItems>
    </Menu>
  );
}
