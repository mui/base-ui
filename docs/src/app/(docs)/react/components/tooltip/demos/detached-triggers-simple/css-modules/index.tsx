'use client';
import * as React from 'react';
import { Tooltip } from '@base-ui/react/tooltip';
import styles from '../../index.module.css';

const demoTooltip = Tooltip.createHandle();

export default function TooltipDetachedTriggersSimpleDemo() {
  return (
    <Tooltip.Provider>
      <Tooltip.Trigger className={styles.IconButton} handle={demoTooltip}>
        <InfoIcon aria-label="This is a detached tooltip" className={styles.Icon} />
      </Tooltip.Trigger>

      <Tooltip.Root handle={demoTooltip}>
        <Tooltip.Portal>
          <Tooltip.Positioner sideOffset={11}>
            <Tooltip.Popup className={styles.Popup}>
              <Tooltip.Arrow className={styles.Arrow} />
              This is a detached tooltip
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
