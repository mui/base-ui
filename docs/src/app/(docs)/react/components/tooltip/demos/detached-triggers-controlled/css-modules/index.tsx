'use client';
import * as React from 'react';
import { Tooltip } from '@base-ui/react/tooltip';
import styles from '../../index.module.css';

const demoTooltip = Tooltip.createHandle();

export default function TooltipDetachedTriggersControlledDemo() {
  const [open, setOpen] = React.useState(false);
  const [triggerId, setTriggerId] = React.useState<string | null>(null);

  const handleOpenChange = (isOpen: boolean, eventDetails: Tooltip.Root.ChangeEventDetails) => {
    setOpen(isOpen);
    setTriggerId(eventDetails.trigger?.id ?? null);
  };

  return (
    <Tooltip.Provider>
      <div className={styles.Container}>
        <div className={styles.ButtonGroup}>
          <Tooltip.Trigger className={styles.IconButton} handle={demoTooltip} id="trigger-1">
            <InfoIcon aria-label="Controlled tooltip" className={styles.Icon} />
          </Tooltip.Trigger>

          <Tooltip.Trigger className={styles.IconButton} handle={demoTooltip} id="trigger-2">
            <InfoIcon aria-label="Controlled tooltip" className={styles.Icon} />
          </Tooltip.Trigger>

          <Tooltip.Trigger className={styles.IconButton} handle={demoTooltip} id="trigger-3">
            <InfoIcon aria-label="Controlled tooltip" className={styles.Icon} />
          </Tooltip.Trigger>
        </div>

        <button
          type="button"
          className={styles.Button}
          onClick={() => {
            setTriggerId('trigger-2');
            setOpen(true);
          }}
        >
          Open programmatically
        </button>
      </div>

      <Tooltip.Root
        handle={demoTooltip}
        open={open}
        onOpenChange={handleOpenChange}
        triggerId={triggerId}
      >
        <Tooltip.Portal>
          <Tooltip.Positioner sideOffset={11} className={styles.Positioner}>
            <Tooltip.Popup className={styles.Popup}>
              <Tooltip.Arrow className={styles.Arrow} />
              Controlled tooltip
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

function InfoIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}
