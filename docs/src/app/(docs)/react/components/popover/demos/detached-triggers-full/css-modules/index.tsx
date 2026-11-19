'use client';
import * as React from 'react';
import { Popover } from '@base-ui/react/popover';
import baseStyles from '../../_index.module.css';
import styles from './index.module.css';

const demoPopover = Popover.createHandle<React.ComponentType>();

export default function PopoverDetachedTriggersFullDemo() {
  return (
    <div className={styles.Container}>
      <Popover.Trigger className={baseStyles.Button} handle={demoPopover} payload={ShippingPanel}>
        Shipping
      </Popover.Trigger>

      <Popover.Trigger className={baseStyles.Button} handle={demoPopover} payload={ReturnsPanel}>
        Returns
      </Popover.Trigger>

      <Popover.Trigger className={baseStyles.Button} handle={demoPopover} payload={ProfilePanel}>
        Profile
      </Popover.Trigger>

      <Popover.Root handle={demoPopover}>
        {({ payload: Payload }) => (
          <Popover.Portal>
            <Popover.Positioner sideOffset={8} className={styles.Positioner}>
              <Popover.Popup className={styles.Popup}>
                <Popover.Arrow className={styles.Arrow} />

                <Popover.Viewport className={styles.Viewport}>
                  {Payload !== undefined && <Payload />}
                </Popover.Viewport>

                <Popover.Close aria-label="Close" className={styles.Close}>
                  <XIcon />
                </Popover.Close>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        )}
      </Popover.Root>
    </div>
  );
}

function ShippingPanel() {
  return (
    <div className={styles.Stack}>
      <Popover.Title className={styles.Title}>Free shipping</Popover.Title>
      <Popover.Description className={styles.Description}>
        Orders over $50 arrive in 3–5 business days at no extra cost.
      </Popover.Description>
    </div>
  );
}

function ProfilePanel() {
  return (
    <div className={styles.ProfilePanel}>
      <Popover.Title className={styles.Title}>Jason Eventon</Popover.Title>
      <img
        src="https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=128&h=128&dpr=2&q=80"
        width="48"
        height="48"
        alt=""
        className={styles.Avatar}
      />
      <span className={styles.Plan}>Pro plan</span>
      <div className={styles.ProfileActions}>
        <a href="#">Profile settings</a>
        <a href="#">Log out</a>
      </div>
    </div>
  );
}

function ReturnsPanel() {
  return (
    <div className={styles.Stack}>
      <Popover.Title className={styles.Title}>Free returns</Popover.Title>
      <Popover.Description className={styles.Description}>
        Return any item within 30 days for a full refund.
      </Popover.Description>
    </div>
  );
}

function XIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeLinecap="square"
      strokeLinejoin="round"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="m4.5 4.5 7 7m-7 0 7-7" />
    </svg>
  );
}
