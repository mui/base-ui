import * as React from 'react';
import * as Menu from '@base_ui/react/Menu';
import { styled } from '@mui/system';

export default function NestedMenu() {
  const createHandleMenuClick = (menuItem) => {
    return () => {
      console.log(`Clicked on ${menuItem}`);
    };
  };

  return (
    <Menu.Root>
      <MenuButton>Format</MenuButton>
      <Menu.Positioner side="bottom" alignment="start">
        <MenuPopup>
          <Menu.Root>
            <ItemTrigger>Text color</ItemTrigger>
            <Menu.Positioner alignment="start" side="right">
              <MenuPopup>
                <MenuItem onClick={createHandleMenuClick('Text color/Black')}>
                  Black
                </MenuItem>
                <MenuItem onClick={createHandleMenuClick('Text color/Dark grey')}>
                  Dark grey
                </MenuItem>
                <MenuItem onClick={createHandleMenuClick('Text color/Accent')}>
                  Accent
                </MenuItem>
              </MenuPopup>
            </Menu.Positioner>
          </Menu.Root>

          <Menu.Root>
            <ItemTrigger>Style</ItemTrigger>
            <Menu.Positioner alignment="start" side="right">
              <MenuPopup>
                <Menu.Root>
                  <ItemTrigger>Heading</ItemTrigger>
                  <Menu.Positioner alignment="start" side="right">
                    <MenuPopup>
                      <MenuItem
                        onClick={createHandleMenuClick('Style/Heading/Level 1')}
                      >
                        Level 1
                      </MenuItem>
                      <MenuItem
                        onClick={createHandleMenuClick('Style/Heading/Level 2')}
                      >
                        Level 2
                      </MenuItem>
                      <MenuItem
                        onClick={createHandleMenuClick('Style/Heading/Level 3')}
                      >
                        Level 3
                      </MenuItem>
                    </MenuPopup>
                  </Menu.Positioner>
                </Menu.Root>
                <MenuItem onClick={createHandleMenuClick('Style/Paragraph')}>
                  Paragraph
                </MenuItem>
              </MenuPopup>
            </Menu.Positioner>
          </Menu.Root>

          <MenuItem onClick={createHandleMenuClick('Clear formatting')}>
            Clear formatting
          </MenuItem>
        </MenuPopup>
      </Menu.Positioner>
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

  &[data-state='closed'] {
    opacity: 0;
    transform: scale(0.95, 0.8);
    transition: opacity 200ms ease-in, transform 200ms ease-in;
  }
  
  &[data-state='open'] {
    opacity: 1;
    transform: scale(1, 1);
    transition: opacity 100ms ease-out, transform 100ms cubic-bezier(0.43, 0.29, 0.37, 1.48);
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

const ItemTrigger = styled(Menu.ItemTrigger)(
  ({ theme }) => `
  list-style: none;
  padding: 8px;
  border-radius: 8px;
  cursor: default;
  user-select: none;

  &:last-of-type {
    border-bottom: none;
  }

  &::after {
    content: '›';
    float: right;
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
