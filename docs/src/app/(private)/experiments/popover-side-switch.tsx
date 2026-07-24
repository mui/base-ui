'use client';
import * as React from 'react';
import { Popover } from '@base-ui/react/popover';
import styles from './popover-side-switch.module.css';

const handle = Popover.createHandle<'small' | 'tall'>();

export default function PopoverSideSwitch() {
  return (
    <div>
      <p style={{ maxWidth: 480 }}>
        Trigger A opens below (side bottom, small content). Trigger B is near the bottom of the
        viewport with tall content, so the popup flips above it. Moving between A and B switches the
        rendered side; both the position and the size should transition smoothly.
      </p>

      <Popover.Trigger
        handle={handle}
        payload="small"
        data-exp="a"
        style={{ position: 'fixed', top: 100, left: 100 }}
      >
        A (small, below)
      </Popover.Trigger>

      <Popover.Trigger
        handle={handle}
        payload="tall"
        data-exp="b"
        style={{ position: 'fixed', bottom: 80, left: 100 }}
      >
        B (tall, above)
      </Popover.Trigger>

      <Popover.Root handle={handle}>
        {({ payload }) => (
          <Popover.Portal>
            <Popover.Positioner sideOffset={8} className={styles.Positioner} data-exp="positioner">
              <Popover.Popup className={styles.Popup} data-exp="popup">
                <Popover.Viewport className={styles.Viewport}>
                  {payload === 'tall' ? (
                    <div style={{ width: 220, height: 200 }}>tall content</div>
                  ) : (
                    <div style={{ width: 160, height: 60 }}>small content</div>
                  )}
                </Popover.Viewport>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        )}
      </Popover.Root>
    </div>
  );
}
