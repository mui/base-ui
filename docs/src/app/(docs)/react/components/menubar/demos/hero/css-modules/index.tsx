'use client';
import * as React from 'react';
import { Menubar } from '@base-ui/react/menubar';
import { Menu } from '@base-ui/react/menu';
import styles from './index.module.css';

export default function ExampleMenubar() {
  return (
    <Menubar className={styles.Menubar}>
      <Menu.Root>
        <Menu.Trigger className={styles.MenuTrigger}>File</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className={styles.MenuPositioner} sideOffset={6} alignOffset={-2}>
            <Menu.Popup className={styles.MenuPopup}>
              <Menu.Item className={styles.MenuItem} onClick={handleClick}>
                New
              </Menu.Item>
              <Menu.Item className={styles.MenuItem} onClick={handleClick}>
                Open
              </Menu.Item>
              <Menu.Item className={styles.MenuItem} onClick={handleClick}>
                Save
              </Menu.Item>

              <Menu.SubmenuRoot>
                <Menu.SubmenuTrigger className={styles.MenuItem}>
                  Export
                  <ChevronRightIcon />
                </Menu.SubmenuTrigger>
                <Menu.Portal>
                  <Menu.Positioner alignOffset={-4}>
                    <Menu.Popup className={styles.MenuPopup}>
                      <Menu.Item className={styles.MenuItem} onClick={handleClick}>
                        PDF
                      </Menu.Item>
                      <Menu.Item className={styles.MenuItem} onClick={handleClick}>
                        PNG
                      </Menu.Item>
                      <Menu.Item className={styles.MenuItem} onClick={handleClick}>
                        SVG
                      </Menu.Item>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.SubmenuRoot>

              <Menu.Separator className={styles.MenuSeparator} />
              <Menu.Item className={styles.MenuItem} onClick={handleClick}>
                Print
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <Menu.Root>
        <Menu.Trigger className={styles.MenuTrigger}>Edit</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className={styles.MenuPositioner} sideOffset={6}>
            <Menu.Popup className={styles.MenuPopup}>
              <Menu.Item className={styles.MenuItem} onClick={handleClick}>
                Cut
              </Menu.Item>
              <Menu.Item className={styles.MenuItem} onClick={handleClick}>
                Copy
              </Menu.Item>
              <Menu.Item className={styles.MenuItem} onClick={handleClick}>
                Paste
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <Menu.Root>
        <Menu.Trigger className={styles.MenuTrigger}>View</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className={styles.MenuPositioner} sideOffset={6}>
            <Menu.Popup className={styles.MenuPopup}>
              <Menu.Item className={styles.MenuItem} onClick={handleClick}>
                Zoom In
              </Menu.Item>
              <Menu.Item className={styles.MenuItem} onClick={handleClick}>
                Zoom Out
              </Menu.Item>

              <Menu.SubmenuRoot>
                <Menu.SubmenuTrigger className={styles.MenuItem}>
                  Layout
                  <ChevronRightIcon />
                </Menu.SubmenuTrigger>
                <Menu.Portal>
                  <Menu.Positioner alignOffset={-4}>
                    <Menu.Popup className={styles.MenuPopup}>
                      <Menu.Item className={styles.MenuItem} onClick={handleClick}>
                        Single Page
                      </Menu.Item>
                      <Menu.Item className={styles.MenuItem} onClick={handleClick}>
                        Two Pages
                      </Menu.Item>
                      <Menu.Item className={styles.MenuItem} onClick={handleClick}>
                        Continuous
                      </Menu.Item>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.SubmenuRoot>

              <Menu.Separator className={styles.MenuSeparator} />
              <Menu.Item className={styles.MenuItem} onClick={handleClick}>
                Full Screen
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <Menu.Root disabled>
        <Menu.Trigger className={styles.MenuTrigger}>Help</Menu.Trigger>
      </Menu.Root>
    </Menubar>
  );
}

function handleClick(event: React.MouseEvent<HTMLElement>) {
  // eslint-disable-next-line no-console
  console.log(`${event.currentTarget.textContent} clicked`);
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
