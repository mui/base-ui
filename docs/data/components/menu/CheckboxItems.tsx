'use client';

import * as React from 'react';
import { Menu } from '@base-ui-components/react/menu';
import { styled } from '@mui/system';

export default function CheckboxItems() {
  const createHandleMenuClick = (menuItem: string) => {
    return () => {
      console.log(`Clicked on ${menuItem}`);
    };
  };

  return (
    <Menu.Root>
      <MenuButton>My account</MenuButton>
      <MenuPositioner align="start" keepMounted>
        <MenuPopup>
          <MenuItem onClick={createHandleMenuClick('Profile')}>Profile</MenuItem>
          <MenuItem onClick={createHandleMenuClick('Language settings')}>
            Language settings
          </MenuItem>
          <CheckboxItem>
            <Indicator />
            Mute notifications
          </CheckboxItem>
          <CheckboxItem defaultChecked>
            <Indicator />
            Enable preview features
          </CheckboxItem>
          <MenuItem onClick={createHandleMenuClick('Log out')}>Log out</MenuItem>
        </MenuPopup>
      </MenuPositioner>
    </Menu.Root>
  );
}

const blue = {
  50: '#F0F7FF',
  100: '#C2E0FF',
  200: '#99CCF3',
  300: '#66B2FF',
  400: '#3399FF',
  500: '#007FFF',
  600: '#0072E6',
  700: '#0059B3',
  800: '#004C99',
  900: '#003A75',
};

const grey = {
  50: '#F3F6F9',
  100: '#E5EAF2',
  200: '#DAE2ED',
  300: '#C7D0DD',
  400: '#B0B8C4',
  500: '#9DA8B7',
  600: '#6B7A90',
  700: '#434D5B',
  800: '#303740',
  900: '#1C2025',
};

const MenuPopup = styled(Menu.Popup)(
  ({ theme }) => `
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 0.875rem;
  box-sizing: border-box;
  padding: 6px;
  margin: 12px 0;
  min-width: 200px;
  border-radius: 12px;
  overflow: auto;
  outline: 0;
  background: ${theme.palette.mode === 'dark' ? grey[900] : '#fff'};
  border: 1px solid ${theme.palette.mode === 'dark' ? grey[700] : grey[200]};
  color: ${theme.palette.mode === 'dark' ? grey[300] : grey[900]};
  box-shadow: 0px 4px 30px ${theme.palette.mode === 'dark' ? grey[900] : grey[200]};
  z-index: 1;
  transform-origin: var(--transform-origin);
  opacity: 0;
  transform: scale(0.8);
  transition: opacity 100ms ease-in, transform 100ms ease-in;

  &[data-open] {
    opacity: 1;
    transform: scale(1);
  }
  `,
);

const MenuItem = styled(Menu.Item)(
  ({ theme }) => `
  list-style: none;
  padding: 8px;
  border-radius: 8px;
  cursor: default;
  user-select: none;

  &:last-of-type {
    border-bottom: none;
  }

  &:focus {
    outline: 3px solid ${theme.palette.mode === 'dark' ? blue[600] : blue[200]};
    background-color: ${theme.palette.mode === 'dark' ? grey[800] : grey[100]};
    color: ${theme.palette.mode === 'dark' ? grey[300] : grey[900]};
  }

  &[data-disabled] {
    color: ${theme.palette.mode === 'dark' ? grey[700] : grey[400]};
  }
  `,
);

const CheckboxItem = styled(Menu.CheckboxItem)(
  ({ theme }) => `
  list-style: none;
  padding: 8px;
  border-radius: 8px;
  cursor: default;
  user-select: none;

  &:last-of-type {
    border-bottom: none;
  }

  &:focus {
    outline: 3px solid ${theme.palette.mode === 'dark' ? blue[600] : blue[200]};
    background-color: ${theme.palette.mode === 'dark' ? grey[800] : grey[100]};
    color: ${theme.palette.mode === 'dark' ? grey[300] : grey[900]};
  }

  &[data-disabled] {
    color: ${theme.palette.mode === 'dark' ? grey[700] : grey[400]};
  }
  `,
);

const Indicator = styled(Menu.CheckboxItemIndicator)(
  ({ theme }) => `
  display: inline-block;
  width: 0.75rem;
  height: 0.75rem;
  border: 1px solid;
  vertical-align: baseline;
  margin-right: 8px;
  border-color: ${theme.palette.mode === 'dark' ? grey[800] : grey[700]};
  box-sizing: border-box;
  border-radius: 2px;


  &[data-checked] {
    background: ${theme.palette.mode === 'dark' ? grey[800] : grey[700]};
    box-shadow: 0 0 0 2px ${theme.palette.mode === 'dark' ? grey[900] : '#fff'} inset;
  }
  `,
);

const MenuButton = styled(Menu.Trigger)(
  ({ theme }) => `
  font-family: 'IBM Plex Sans', sans-serif;
  font-weight: 600;
  font-size: 0.875rem;
  line-height: 1.5;
  padding: 8px 16px;
  border-radius: 8px;
  color: white;
  transition: all 150ms ease;
  cursor: pointer;
  background: ${theme.palette.mode === 'dark' ? grey[900] : '#fff'};
  border: 1px solid ${theme.palette.mode === 'dark' ? grey[700] : grey[200]};
  color: ${theme.palette.mode === 'dark' ? grey[200] : grey[900]};
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);

  &:hover {
    background: ${theme.palette.mode === 'dark' ? grey[800] : grey[50]};
    border-color: ${theme.palette.mode === 'dark' ? grey[600] : grey[300]};
  }

  &:active {
    background: ${theme.palette.mode === 'dark' ? grey[700] : grey[100]};
  }

  &:focus-visible {
    box-shadow: 0 0 0 4px ${theme.palette.mode === 'dark' ? blue[300] : blue[200]};
    outline: none;
  }
  `,
);

const MenuPositioner = styled(Menu.Positioner)`
  &:focus-visible {
    outline: 0;
  }

  &[data-closed] {
    pointer-events: none;
  }
`;
