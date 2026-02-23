'use client';
import * as React from 'react';
import { DrawerPreview as Drawer } from '@base-ui/react/drawer';
import { ScrollArea } from '@base-ui/react/scroll-area';
import styles from './index.module.css';

const ITEMS = [
  { href: '#', label: 'Overview' },
  { href: '#', label: 'Components' },
  { href: '#', label: 'Utilities' },
  { href: '#', label: 'Releases' },
] as const;

const LONG_LIST = Array.from({ length: 50 }, (_, i) => ({
  href: '#',
  label: `Item ${i + 1}`,
}));

export default function ExampleDrawerMobileNav() {
  return (
    <Drawer.Root>
      <Drawer.Trigger className={styles.Button}>Open mobile menu</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop className={styles.Backdrop} />
        <Drawer.Viewport className={styles.Viewport}>
          <ScrollArea.Root style={{ position: undefined }} className={styles.ScrollAreaRoot}>
            <ScrollArea.Viewport className={styles.ScrollAreaViewport}>
              <ScrollArea.Content className={styles.ScrollContent}>
                <Drawer.Popup className={styles.Popup}>
                  <nav aria-label="Navigation" className={styles.Panel}>
                    <div className={styles.Header}>
                      <div aria-hidden className={styles.HeaderSpacer} />
                      <div className={styles.Handle} />
                      <Drawer.Close aria-label="Close menu" className={styles.CloseButton}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path
                            d="M0.75 0.75L6 6M11.25 11.25L6 6M6 6L0.75 11.25M6 6L11.25 0.75"
                            stroke="currentcolor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </Drawer.Close>
                    </div>

                    <Drawer.Content className={styles.Content}>
                      <Drawer.Title className={styles.Title}>Menu</Drawer.Title>
                      <Drawer.Description className={styles.Description}>
                        Scroll the long list. Flick down from the top to dismiss.
                      </Drawer.Description>

                      <div className={styles.ScrollArea}>
                        <ul className={styles.List}>
                          {ITEMS.map((item) => (
                            <li key={item.label} className={styles.Item}>
                              <a className={styles.Link} href={item.href}>
                                {item.label}
                              </a>
                            </li>
                          ))}
                        </ul>

                        <ul className={styles.LongList} aria-label="Long list">
                          {LONG_LIST.map((item) => (
                            <li key={item.label} className={styles.Item}>
                              <a className={styles.Link} href={item.href}>
                                {item.label}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </Drawer.Content>
                  </nav>
                </Drawer.Popup>
              </ScrollArea.Content>
            </ScrollArea.Viewport>
            <ScrollArea.Scrollbar className={styles.Scrollbar}>
              <ScrollArea.Thumb className={styles.ScrollbarThumb} />
            </ScrollArea.Scrollbar>
          </ScrollArea.Root>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
