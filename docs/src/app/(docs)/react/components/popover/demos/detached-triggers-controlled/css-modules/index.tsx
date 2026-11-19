'use client';
import * as React from 'react';
import { Popover } from '@base-ui/react/popover';
import styles from '../../_index.module.css';

const demoPopover = Popover.createHandle();

export default function PopoverDetachedTriggersControlledDemo() {
  const [open, setOpen] = React.useState(false);
  const [triggerId, setTriggerId] = React.useState<string | null>(null);

  const handleOpenChange = (isOpen: boolean, eventDetails: Popover.Root.ChangeEventDetails) => {
    setOpen(isOpen);
    setTriggerId(eventDetails.trigger?.id ?? null);
  };

  return (
    <React.Fragment>
      <div className={styles.Container}>
        <Popover.Trigger className={styles.Button} handle={demoPopover} id="trigger-1">
          Trigger 1
        </Popover.Trigger>

        <Popover.Trigger className={styles.Button} handle={demoPopover} id="trigger-2">
          Trigger 2
        </Popover.Trigger>

        <Popover.Trigger className={styles.Button} handle={demoPopover} id="trigger-3">
          Trigger 3
        </Popover.Trigger>

        <button
          className={styles.Button}
          type="button"
          onClick={() => {
            setTriggerId('trigger-2');
            setOpen(true);
          }}
        >
          Open programmatically
        </button>
      </div>

      <Popover.Root
        handle={demoPopover}
        open={open}
        onOpenChange={handleOpenChange}
        triggerId={triggerId}
      >
        <Popover.Portal>
          <Popover.Positioner className={styles.Positioner} sideOffset={8}>
            <Popover.Popup className={styles.Popup}>
              <Popover.Arrow className={styles.Arrow} />
              <Popover.Title className={styles.Title}>Free shipping</Popover.Title>
              <Popover.Description className={styles.Description}>
                Orders over $50 arrive in 3–5 business days at no extra cost.
              </Popover.Description>
              <a href="#" className={styles.Link}>
                View shipping policy
              </a>
              <Popover.Close aria-label="Close" className={styles.Close}>
                <XIcon />
              </Popover.Close>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </React.Fragment>
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
