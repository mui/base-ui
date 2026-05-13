'use client';
import * as React from 'react';
import { Tooltip } from '@base-ui/react/tooltip';
import styles from './index.module.css';

const demoTooltip = Tooltip.createHandle<React.ComponentType>();

export default function TooltipDetachedTriggersFullDemo() {
  return (
    <Tooltip.Provider>
      <div className={styles.ButtonGroup}>
        <Tooltip.Trigger className={styles.Button} handle={demoTooltip} payload={InfoContent}>
          <InfoIcon aria-label="This is information about the feature" />
        </Tooltip.Trigger>

        <Tooltip.Trigger className={styles.Button} handle={demoTooltip} payload={HelpContent}>
          <HelpIcon aria-label="Need help?" />
        </Tooltip.Trigger>

        <Tooltip.Trigger className={styles.Button} handle={demoTooltip} payload={AlertContent}>
          <AlertIcon aria-label="Warning: This action cannot be undone" />
        </Tooltip.Trigger>
      </div>

      <Tooltip.Root handle={demoTooltip}>
        {({ payload: Payload }) => (
          <Tooltip.Portal>
            <Tooltip.Positioner sideOffset={11} className={styles.Positioner}>
              <Tooltip.Popup className={styles.Popup}>
                <Tooltip.Arrow className={styles.Arrow} />

                <Tooltip.Viewport className={styles.Viewport}>
                  {Payload !== undefined && <Payload />}
                </Tooltip.Viewport>
              </Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        )}
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

function InfoContent() {
  return <span>This is information about the feature</span>;
}

function HelpContent() {
  return <span>Need help?</span>;
}

function AlertContent() {
  return <span>Warning: This action cannot be undone</span>;
}

function InfoIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      strokeLinecap="square"
      strokeLinejoin="round"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

function HelpIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      strokeLinecap="square"
      strokeLinejoin="round"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <circle cx="12" cy="12" r="10" vectorEffect="non-scaling-stroke" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" vectorEffect="non-scaling-stroke" />
      <path d="M12 17h.01" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function AlertIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      strokeLinecap="square"
      strokeLinejoin="round"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}
