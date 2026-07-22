'use client';
import * as React from 'react';
import { Tooltip } from '@base-ui/react/tooltip';
import baseStyles from '../../index.module.css';
import styles from './index.module.css';

const MESSAGES = [
  'Syncing…',
  'Uploading 3 of 12 files',
  'Almost done',
  'All changes saved to the cloud',
];

export default function TooltipTransitionKeyDemo() {
  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState(0);

  // While the tooltip stays open, advance the content on a timer. The trigger never
  // changes, so the morph is driven purely by `transitionKey`.
  React.useEffect(() => {
    if (!open) {
      setStep(0);
      return undefined;
    }
    const timeout = setTimeout(() => {
      setStep((prev) => (prev + 1) % MESSAGES.length);
    }, 1600);
    return () => clearTimeout(timeout);
  }, [open, step]);

  return (
    <Tooltip.Provider>
      <Tooltip.Root open={open} onOpenChange={setOpen}>
        <Tooltip.Trigger className={baseStyles.Button}>Sync status</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner sideOffset={8} className={styles.Positioner}>
            <Tooltip.Popup className={styles.Popup}>
              <Tooltip.Viewport className={styles.Viewport} transitionKey={step}>
                <span className={styles.Content}>{MESSAGES[step]}</span>
              </Tooltip.Viewport>
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
