'use client';
import * as React from 'react';
import { Drawer } from '@base-ui/react/drawer';
import styles from './index.module.css';

const TOP_MARGIN_REM = 2;

export default function ExampleDrawerVirtualKeyboardAware() {
  return (
    <Drawer.Root>
      <Drawer.Trigger className={styles.Button}>Open keyboard-aware drawer</Drawer.Trigger>
      <Drawer.VirtualKeyboardProvider>
        <Drawer.Portal>
          <Drawer.Backdrop className={styles.Backdrop} />
          <Drawer.Viewport className={styles.Viewport}>
            <Drawer.Popup
              className={styles.Popup}
              style={{ '--top-margin': `${TOP_MARGIN_REM}rem` } as React.CSSProperties}
            >
              <div className={styles.Chrome}>
                <div className={styles.Handle} />
                <Drawer.Title className={styles.Title}>Delivery checklist</Drawer.Title>
                <Drawer.Description className={styles.Description}>
                  The list scrolls independently while the note field stays pinned to the bottom.
                </Drawer.Description>
              </div>

              <Drawer.Content className={styles.Scroll}>
                <div className={styles.List}>
                  {Array.from({ length: 16 }, (_, index) => (
                    <div aria-hidden className={styles.Card} key={index} />
                  ))}
                </div>
              </Drawer.Content>

              <div className={styles.Footer}>
                <div className={styles.FooterInner}>
                  <label className={styles.Field}>
                    <span className={styles.FieldLabel}>Driver message</span>
                    <input
                      className={styles.Input}
                      placeholder="Leave gate code or drop-off instructions"
                      type="text"
                    />
                  </label>

                  <div className={styles.Actions}>
                    <Drawer.Close className={styles.Button}>Close</Drawer.Close>
                  </div>
                </div>
              </div>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.VirtualKeyboardProvider>
    </Drawer.Root>
  );
}
