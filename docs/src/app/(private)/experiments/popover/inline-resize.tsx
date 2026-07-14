'use client';
import * as React from 'react';
import { Popover } from '@base-ui/react/popover';
import styles from './inline-resize.module.css';

type View = 'summary' | 'shipping';

export default function Experiment() {
  const [view, setView] = React.useState<View>('summary');

  return (
    <div className={styles.Container}>
      <Popover.Root
        onOpenChangeComplete={(open) => {
          if (!open) {
            setView('summary');
          }
        }}
      >
        <Popover.Trigger className={styles.Button}>Review order</Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner sideOffset={8} className={styles.Positioner}>
            <Popover.Popup className={styles.Popup}>
              <Popover.Viewport className={styles.Viewport} transitionKey={view}>
                {view === 'summary' ? (
                  <div className={styles.Summary}>
                    <h2 className={styles.Title}>Order summary</h2>
                    <p className={styles.Description}>Two items are ready to ship.</p>
                    <button
                      type="button"
                      className={styles.Button}
                      onClick={() => setView('shipping')}
                    >
                      Choose shipping
                    </button>
                  </div>
                ) : (
                  <div className={styles.Shipping}>
                    <h2 className={styles.Title}>Shipping address</h2>
                    <label className={styles.Label}>
                      Street address
                      <input className={styles.Input} defaultValue="123 Base UI Lane" />
                    </label>
                    <button
                      type="button"
                      className={styles.Button}
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
    </div>
  );
}
