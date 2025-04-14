import * as React from 'react';
import { Menubar } from '@base-ui-components/react/menubar';
import { Menu } from '@base-ui-components/react/menu';
import styles from './index.module.css';

export default function ExampleMenubar() {
  return (
    <Menubar className={styles.Menubar}>
      <Menu.Root>
        <Menu.Trigger className={styles.MenuTrigger}>File</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className={styles.MenuPositioner}>
            <Menu.Popup className={styles.MenuPopup}>
              <Menu.Item className={styles.MenuItem}>New</Menu.Item>
              <Menu.Item className={styles.MenuItem}>Open</Menu.Item>
              <Menu.Item className={styles.MenuItem}>Save</Menu.Item>

              <Menu.Root>
                <Menu.SubmenuTrigger className={styles.MenuItem}>
                  Export
                  <span className={styles.RightSlot}>
                    <ChevronRightIcon className={styles.ChevronIcon} />
                  </span>
                </Menu.SubmenuTrigger>
                <Menu.Portal>
                  <Menu.Positioner>
                    <Menu.Popup className={styles.MenuPopup}>
                      <Menu.Item className={styles.MenuItem}>PDF</Menu.Item>
                      <Menu.Item className={styles.MenuItem}>PNG</Menu.Item>
                      <Menu.Item className={styles.MenuItem}>SVG</Menu.Item>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.Root>

              <Menu.Separator className={styles.MenuSeparator} />
              <Menu.Item className={styles.MenuItem}>Print</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <Menu.Root>
        <Menu.Trigger className={styles.MenuTrigger}>Edit</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className={styles.MenuPositioner}>
            <Menu.Popup className={styles.MenuPopup}>
              <Menu.Item className={styles.MenuItem}>Cut</Menu.Item>
              <Menu.Item className={styles.MenuItem}>Copy</Menu.Item>
              <Menu.Item className={styles.MenuItem}>Paste</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <Menu.Root>
        <Menu.Trigger className={styles.MenuTrigger}>View</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className={styles.MenuPositioner}>
            <Menu.Popup className={styles.MenuPopup}>
              <Menu.Item className={styles.MenuItem}>Zoom In</Menu.Item>
              <Menu.Item className={styles.MenuItem}>Zoom Out</Menu.Item>

              <Menu.Root>
                <Menu.SubmenuTrigger className={styles.MenuItem}>
                  Layout
                  <span className={styles.RightSlot}>
                    <ChevronRightIcon className={styles.ChevronIcon} />
                  </span>
                </Menu.SubmenuTrigger>
                <Menu.Portal>
                  <Menu.Positioner>
                    <Menu.Popup className={styles.MenuPopup}>
                      <Menu.Item className={styles.MenuItem}>Single Page</Menu.Item>
                      <Menu.Item className={styles.MenuItem}>Two Pages</Menu.Item>
                      <Menu.Item className={styles.MenuItem}>Continuous</Menu.Item>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.Root>

              <Menu.Separator className={styles.MenuSeparator} />
              <Menu.Item className={styles.MenuItem}>Full Screen</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <Menu.Root>
        <Menu.Trigger className={styles.MenuTrigger} disabled>
          Help
        </Menu.Trigger>
      </Menu.Root>
    </Menubar>
  );
}

function ChevronRightIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...props}>
      <path
        d="M6 12L10 8L6 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
