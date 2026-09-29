'use client';
import * as React from 'react';
import { Menu } from '@base-ui/react/menu';
import styles from './menu.module.css';

/**
 * Repro for https://github.com/mui/base-ui/issues/4224: a `defaultOpen` submenu inside a menu that
 * is opened by the user. The submenu should animate in alongside its parent rather than appearing
 * fully formed. Slowed down so the enter transition is easy to see.
 */
export default function DefaultOpenSubmenuExperiment() {
  return (
    <div style={{ padding: 40 }}>
      <style>{`
        [data-testid='root-popup'],
        [data-testid='submenu-popup'] {
          transition-duration: 2000ms !important;
          transition-timing-function: linear !important;
        }
      `}</style>

      <div style={{ marginTop: 120, marginLeft: 120 }}>
        <Menu.Root>
          <Menu.Trigger className={styles.Button}>Open menu</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner className={styles.Positioner} sideOffset={8}>
              <Menu.Popup className={styles.Popup} data-testid="root-popup">
                <Menu.Item className={styles.Item}>Item 1</Menu.Item>
                <Menu.Item className={styles.Item}>Item 2</Menu.Item>
                <Menu.SubmenuRoot defaultOpen>
                  <Menu.SubmenuTrigger className={styles.SubmenuTrigger}>
                    Submenu trigger
                  </Menu.SubmenuTrigger>
                  <Menu.Portal>
                    <Menu.Positioner className={styles.Positioner} sideOffset={8}>
                      <Menu.Popup className={styles.Popup} data-testid="submenu-popup">
                        <Menu.Item className={styles.Item}>Sub item 1</Menu.Item>
                        <Menu.Item className={styles.Item}>Sub item 2</Menu.Item>
                      </Menu.Popup>
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.SubmenuRoot>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </div>
    </div>
  );
}
