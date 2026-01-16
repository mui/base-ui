'use client';
import * as React from 'react';
import { Drawer } from '@base-ui/react/drawer';
import styles from './index.module.css';

export default function ExampleDrawer() {
  const [portalContainer, setPortalContainer] = React.useState<HTMLDivElement | null>(null);
  const popupRef = React.useRef<HTMLDivElement | null>(null);

  return (
    <Drawer.Provider>
      <div className={styles.Root} ref={setPortalContainer}>
        <Drawer.IndentBackground className={styles.IndentBackground} />
        <Drawer.Indent className={styles.Indent}>
          <div className={styles.Center}>
            <Drawer.Root swipeDirection="down" modal={false}>
              <Drawer.Trigger className={styles.Button}>Open drawer</Drawer.Trigger>
              <Drawer.Portal container={portalContainer}>
                <Drawer.Backdrop className={styles.Backdrop} />
                <Drawer.Viewport className={styles.Viewport}>
                  <Drawer.Popup ref={popupRef} className={styles.Popup} initialFocus={popupRef}>
                    <Drawer.Close className={styles.Button}>Close</Drawer.Close>
                  </Drawer.Popup>
                </Drawer.Viewport>
              </Drawer.Portal>
            </Drawer.Root>
          </div>
        </Drawer.Indent>
      </div>
    </Drawer.Provider>
  );
}
