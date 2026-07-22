'use client';
import * as React from 'react';
import { Drawer } from '@base-ui/react/drawer';
import { Select } from '@base-ui/react/select';
import drawerStyles from './drawer-controlled-opening.module.css';
import selectStyles from '../long-select.module.css';

const fonts = ['Sans-serif', 'Serif', 'Monospace', 'Cursive', 'Fantasy', 'System UI'];

function FontSelect() {
  return (
    <Select.Root defaultValue="Sans-serif">
      <Select.Trigger
        className={selectStyles.Select}
        data-testid="select-trigger"
        style={{ width: '100%' }}
      >
        <Select.Value />
        <Select.Icon className={selectStyles.SelectIcon}>▼</Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner
          className={selectStyles.Positioner}
          sideOffset={8}
          data-testid="select-positioner"
        >
          <Select.Popup className={selectStyles.Popup} data-testid="select-popup">
            <Select.List className={selectStyles.List}>
              {fonts.map((font) => (
                <Select.Item key={font} className={selectStyles.Item} value={font}>
                  <Select.ItemText className={selectStyles.ItemText}>{font}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}

export default function SelectInDrawer() {
  return (
    <Drawer.Root>
      <Drawer.Trigger className={drawerStyles.Button} data-testid="drawer-trigger">
        Open bottom drawer
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop className={drawerStyles.Backdrop} />
        <Drawer.Viewport className={drawerStyles.Viewport}>
          <Drawer.Popup className={drawerStyles.Popup}>
            <div className={drawerStyles.Handle} />
            <Drawer.Content className={drawerStyles.Content}>
              <Drawer.Title className={drawerStyles.Title}>Font settings</Drawer.Title>
              <Drawer.Description className={drawerStyles.Description}>
                Pick a font from the select below.
              </Drawer.Description>
              <FontSelect />
              <div style={{ height: '4rem' }} />
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
