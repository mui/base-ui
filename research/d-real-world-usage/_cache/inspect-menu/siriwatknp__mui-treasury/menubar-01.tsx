'use client';

import * as React from 'react';

import { Menu } from '@base-ui-components/react/menu';
import { Menubar } from '@base-ui-components/react/menubar';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ListItemButton, {
  ListItemButtonProps,
} from '@mui/material/ListItemButton';
import ListItemText, { ListItemTextProps } from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';

function MenuItem({
  children,
  secondary,
  hasSubmenu = false,
  sx,
  ...props
}: ListItemButtonProps &
  Pick<ListItemTextProps, 'secondary'> & { hasSubmenu?: boolean }) {
  return (
    <ListItemButton
      dense
      sx={[{ borderRadius: 0.5 }, ...(Array.isArray(sx) ? sx : [sx])]}
      {...props}
    >
      <ListItemText primary={children} secondary={secondary} />
      {hasSubmenu && <ChevronRightIcon />}
    </ListItemButton>
  );
}

export function Menubar01() {
  return (
    <Menubar
      render={
        <Box
          sx={{
            display: 'inline-flex',
            bgcolor: 'background.paper',
            borderRadius: 1.5,
            p: 0.5,
            gap: 0.5,
            boxShadow: 1,
          }}
        />
      }
    >
      <Menu.Root>
        <Menu.Trigger
          render={
            <Button
              disableFocusRipple
              disableTouchRipple
              sx={{
                '&[data-popup-open]': {
                  bgcolor: 'action.selected',
                },
              }}
            />
          }
        >
          File
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner
            side="bottom"
            align="start"
            sideOffset={4}
            render={
              <Box
                sx={{
                  zIndex: 'modal',
                }}
              />
            }
          >
            <Menu.Popup
              render={
                <Paper
                  sx={{
                    minWidth: 200,
                    p: 0.5,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                />
              }
            >
              <Menu.Item render={<MenuItem />}>New</Menu.Item>
              <Menu.Item render={<MenuItem />}>Open</Menu.Item>
              <Menu.Item render={<MenuItem />}>Save</Menu.Item>

              <Menu.SubmenuRoot>
                <Menu.SubmenuTrigger
                  render={
                    <MenuItem
                      hasSubmenu
                      sx={{
                        '&[data-popup-open]': {
                          bgcolor: 'action.selected',
                        },
                      }}
                    />
                  }
                >
                  Export
                </Menu.SubmenuTrigger>
                <Menu.Portal>
                  <Menu.Positioner
                    side="right"
                    align="start"
                    alignOffset={-4}
                    sideOffset={8}
                    render={
                      <Box
                        sx={{
                          zIndex: 'modal',
                        }}
                      />
                    }
                  >
                    <Menu.Popup
                      render={
                        <Paper
                          sx={{
                            minWidth: 160,
                            p: 0.5,
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        />
                      }
                    >
                      <Menu.Item render={<MenuItem />}>PDF</Menu.Item>
                      <Menu.Item render={<MenuItem />}>PNG</Menu.Item>
                      <Menu.Item render={<MenuItem />}>SVG</Menu.Item>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.SubmenuRoot>

              <Menu.Item render={<MenuItem />}>Print</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <Menu.Root>
        <Menu.Trigger
          render={
            <Button
              disableFocusRipple
              disableTouchRipple
              sx={{
                '&[data-popup-open]': {
                  bgcolor: 'action.selected',
                },
              }}
            />
          }
        >
          Edit
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup></Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <Menu.Root>
        <Menu.Trigger
          render={
            <Button
              disableFocusRipple
              disableTouchRipple
              sx={{
                '&[data-popup-open]': {
                  bgcolor: 'action.selected',
                },
              }}
            />
          }
        >
          View
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup></Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <Menu.Root>
        <Menu.Trigger
          disabled
          render={<Button disableFocusRipple disableTouchRipple />}
        >
          Help
        </Menu.Trigger>
      </Menu.Root>
    </Menubar>
  );
}
