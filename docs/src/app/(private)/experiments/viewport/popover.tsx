'use client';
import * as React from 'react';
import { Popover } from '@base-ui/react/popover';
import { Collapsible } from '@base-ui/react/collapsible';
import styles from './popover.module.css';

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

                    {/* A collapsible drives the popup height while it stays `auto` — no
                        transition key change, so the popup follows the panel naturally. */}
                    <Collapsible.Root className={styles.Collapsible}>
                      <Collapsible.Trigger className={styles.CollapsibleTrigger}>
                        Order details
                        <CaretRightIcon className={styles.Caret} />
                      </Collapsible.Trigger>
                      <Collapsible.Panel className={styles.CollapsiblePanel}>
                        <div className={styles.CollapsibleContent}>
                          <div>Trailrunner backpack — $120</div>
                          <div>Merino wool socks — $18</div>
                          <div>Free shipping on orders over $100</div>
                        </div>
                      </Collapsible.Panel>
                    </Collapsible.Root>

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

function CaretRightIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M6 12V4l4.5 4z" />
    </svg>
  );
}
