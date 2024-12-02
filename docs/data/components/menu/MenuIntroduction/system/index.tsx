'use client';
import * as React from 'react';
import { Menu } from '@base-ui-components/react/menu';
import { styled } from '@mui/system';

export default function MenuIntroduction() {
  const createHandleMenuClick = (menuItem: string) => {
    return () => {
      console.log(`Clicked on ${menuItem}`);
    };
  };

  return (
    <Menu.Root>
      <MenuButton>My account</MenuButton>
      <MenuPositioner align="start" sideOffset={8}>
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
          <MenuArrow />
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
  position: relative;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 0.875rem;
  box-sizing: border-box;
  padding: 6px;
  min-width: 200px;
  border-radius: 12px;
  outline: 0;
  background: ${theme.palette.mode === 'dark' ? grey[900] : '#fff'};
  border: 1px solid ${theme.palette.mode === 'dark' ? grey[700] : grey[200]};
  color: ${theme.palette.mode === 'dark' ? grey[300] : grey[900]};
  box-shadow: 0px 4px 30px ${theme.palette.mode === 'dark' ? grey[900] : grey[200]};
  z-index: 1;
  transform-origin: var(--transform-origin);
  opacity: 1;
  transform: scale(1, 1);
  transition: opacity 100ms ease-in, transform 100ms ease-in;

  @starting-style {
    & {
      opacity: 0;
      transform: scale(0.8);
    }
  }
      
  &[data-ending-style] {
    opacity: 0;
    transform: scale(0.8);
    transition: opacity 200ms ease-in, transform 200ms ease-in;
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

  &.[data-disabled] {
    color: ${theme.palette.mode === 'dark' ? grey[700] : grey[400]};
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
`;

export const MenuArrow = styled(Menu.Arrow)(
  ({ theme }) => `
  width: 10px;
  height: 10px;
  transform: rotate(45deg);
  background: white;
  z-index: -1;
  border: 1px ${theme.palette.mode === 'dark' ? grey[700] : grey[200]};

  &[data-side='top'] {
    border-style: none solid solid none;
    bottom: -6px;
  }

  &[data-side='right'] {
    border-style: none none solid solid;
    left: -6px;
  }

  &[data-side='bottom'] {
    border-style: solid none none solid;
    top: -6px;
  }

  &[data-side='left'] {
    border-style: solid solid none none;
    right: -6px;
  }
`,
);

const MenuSeparator = styled(Menu.Separator)(
  ({ theme }) => `
  border-top: 1px solid ${theme.palette.mode === 'dark' ? grey[700] : grey[200]};
  margin: 8px 0;
`,
);

const MenuGroupLabel = styled(Menu.GroupLabel)(
  ({ theme }) => `
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: ${theme.palette.mode === 'dark' ? grey[200] : grey[700]};
  padding: 8px;
  user-select: none;
`,
);
