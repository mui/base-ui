'use client';
import * as React from 'react';
import { Popover } from '@base-ui/react/popover';
import baseStyles from '../../_index.module.css';
import styles from './index.module.css';

type View = 'summary' | 'shipping';

export default function PopoverTransitionKeyDemo() {
  const [view, setView] = React.useState<View>('summary');

  return (
    <Popover.Root
      onOpenChangeComplete={(open) => {
        if (!open) {
          setView('summary');
        }
      }}
    >
      <Popover.Trigger className={baseStyles.Button}>Review order</Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8} className={styles.Positioner}>
          <Popover.Popup className={styles.Popup}>
            <Popover.Viewport className={styles.Viewport} transitionKey={view}>
              {view === 'summary' ? (
                <div className={styles.Summary}>
                  <Popover.Title className={baseStyles.Title}>Order summary</Popover.Title>
                  <Popover.Description className={baseStyles.Description}>
                    Trailrunner backpack and merino wool socks are ready to ship.
                  </Popover.Description>
                  <button
                    type="button"
                    className={baseStyles.Button}
                    onClick={() => setView('shipping')}
                  >
                    Choose shipping
                  </button>
                </div>
              ) : (
                <div className={styles.Shipping}>
                  <Popover.Title className={baseStyles.Title}>Shipping address</Popover.Title>
                  <label className={styles.Label}>
                    Street address
                    <input className={styles.Input} defaultValue="123 Base UI Lane" />
                  </label>
                  <button
                    type="button"
                    className={baseStyles.Button}
                    onClick={() => setView('summary')}
                  >
                    Back to summary
                  </button>
                </div>
              )}
            </Popover.Viewport>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
