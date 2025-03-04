'use client';
import * as React from 'react';
import { Menu } from '@base-ui-components/react/menu';
import { styled } from '@mui/system';

export default function NestedMenu() {
  const createHandleMenuClick = (menuItem: string) => {
    return () => {
      console.log(`Clicked on ${menuItem}`);
    };
  };

  return (
    <Container>
      <Menu.Root>
        <input type="text" placeholder="Previous element" />
        <MenuButton>Format</MenuButton>
        <Menu.Portal>
          <Menu.Positioner side="bottom" align="start" sideOffset={6}>
            <MenuPopup>
              <Menu.Root>
                <SubmenuTrigger>Text color</SubmenuTrigger>
                <Menu.Portal>
                  <Menu.Positioner align="start" side="right" sideOffset={12}>
                    <MenuPopup>
                      <MenuItem onClick={createHandleMenuClick('Text color/Black')}>
                        Black
                      </MenuItem>
                      <MenuItem
                        onClick={createHandleMenuClick('Text color/Dark grey')}
                      >
                        Dark grey
                      </MenuItem>
                      <MenuItem onClick={createHandleMenuClick('Text color/Accent')}>
                        Accent
                      </MenuItem>
                    </MenuPopup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.Root>

              <Menu.Root>
                <SubmenuTrigger>Style</SubmenuTrigger>
                <Menu.Portal>
                  <Menu.Positioner align="start" side="right" sideOffset={12}>
                    <MenuPopup>
                      <Menu.Root>
                        <SubmenuTrigger>Heading</SubmenuTrigger>
                        <Menu.Portal>
                          <Menu.Positioner
                            align="start"
                            side="right"
                            sideOffset={12}
                          >
                            <MenuPopup>
                              <MenuItem
                                onClick={createHandleMenuClick(
                                  'Style/Heading/Level 1',
                                )}
                              >
                                Level 1
                              </MenuItem>
                              <MenuItem
                                onClick={createHandleMenuClick(
                                  'Style/Heading/Level 2',
                                )}
                              >
                                Level 2
                              </MenuItem>
                              <MenuItem
                                onClick={createHandleMenuClick(
                                  'Style/Heading/Level 3',
                                )}
                              >
                                Level 3
                              </MenuItem>
                            </MenuPopup>
                          </Menu.Positioner>
                        </Menu.Portal>
                      </Menu.Root>
                      <MenuItem onClick={createHandleMenuClick('Style/Paragraph')}>
                        Paragraph
                      </MenuItem>
                      <Menu.Root disabled>
                        <SubmenuTrigger>List</SubmenuTrigger>
                        <Menu.Portal>
                          <Menu.Positioner
                            align="start"
                            side="right"
                            sideOffset={12}
                          >
                            <MenuPopup>
                              <MenuItem
                                onClick={createHandleMenuClick('Style/List/Ordered')}
                              >
                                Ordered
                              </MenuItem>
                              <MenuItem
                                onClick={createHandleMenuClick(
                                  'Style/List/Unordered',
                                )}
                              >
                                Unordered
                              </MenuItem>
                            </MenuPopup>
                          </Menu.Positioner>
                        </Menu.Portal>
                      </Menu.Root>
                    </MenuPopup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.Root>

              <MenuItem onClick={createHandleMenuClick('Clear formatting')}>
                Clear formatting
              </MenuItem>
            </MenuPopup>
          </Menu.Positioner>
        </Menu.Portal>
        <input type="text" placeholder="Next element" />
      </Menu.Root>
    </Container>
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
  min-width: 200px;
  border-radius: 12px;
  overflow: visible;
  outline: 0;
  background: ${theme.palette.mode === 'dark' ? grey[900] : '#fff'};
  border: 1px solid ${theme.palette.mode === 'dark' ? grey[700] : grey[200]};
  color: ${theme.palette.mode === 'dark' ? grey[300] : grey[900]};
  box-shadow: 0 4px 30px ${theme.palette.mode === 'dark' ? grey[900] : grey[200]};
  z-index: 1;
  transform-origin: var(--transform-origin);
  opacity: 1;
  transform: scale(1, 1);
  transition: opacity 100ms ease-in, transform 100ms ease-in;

  &[data-nested] {
    margin-top: -6px;
  }

  &[data-starting-style] {
    opacity: 0;
    transform: scale(0.8);
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

  &:focus,
  &:hover {
    background-color: ${theme.palette.mode === 'dark' ? grey[800] : grey[100]};
    color: ${theme.palette.mode === 'dark' ? grey[300] : grey[900]};
  }

  &:focus-visible {
    outline: none;
  }

  &[data-disabled] {
    color: ${theme.palette.mode === 'dark' ? grey[700] : grey[400]};
  }
  `,
);

const SubmenuTrigger = styled(Menu.SubmenuTrigger)(
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

  &[data-popup-open] {
    background-color: ${theme.palette.mode === 'dark' ? grey[900] : grey[50]};
    color: ${theme.palette.mode === 'dark' ? grey[300] : grey[900]};
  }

  &:focus,
  &:hover {
    background-color: ${theme.palette.mode === 'dark' ? grey[800] : grey[100]};
    color: ${theme.palette.mode === 'dark' ? grey[300] : grey[900]};
  }

  &:focus-visible {
    outline: none;
  }

  &[data-disabled] {
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

const Container = styled('div')`
  display: flex;
  min-height: 110vh;
  box-sizing: border-box;
  align-items: center;
  gap: 20px;
`;
