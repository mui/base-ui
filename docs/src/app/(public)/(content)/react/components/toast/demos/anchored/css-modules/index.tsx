'use client';
import * as React from 'react';
import { Toast } from '@base-ui-components/react/toast';
import { Button } from '@base-ui-components/react/button';
import { Tooltip } from '@base-ui-components/react/tooltip';
import styles from './index.module.css';

export default function ExampleToast() {
  return (
    <Tooltip.Provider>
      <Toast.Provider>
        <CopyButton />
      </Toast.Provider>
    </Tooltip.Provider>
  );
}

function CopyButton() {
  const toastManager = Toast.useToastManager();
  const [copied, setCopied] = React.useState(false);
  const buttonRef = React.useRef<HTMLButtonElement | null>(null);

  function handleCopy() {
    // Simulate copying to clipboard
    navigator.clipboard.writeText('Hello, world!');

    setCopied(true);
    toastManager.add({
      description: 'Copied',
      positionerProps: {
        anchor: buttonRef.current,
        sideOffset: 8,
      },
      timeout: 1500,
      onClose() {
        setCopied(false);
      },
    });
  }

  return (
    <React.Fragment>
      <Tooltip.Root
        disabled={copied}
        onOpenChange={(open, eventDetails) => {
          if (eventDetails.reason === 'trigger-press') {
            eventDetails.cancel();
          }
        }}
      >
        <Tooltip.Trigger
          render={
            <Button
              ref={buttonRef}
              type="button"
              className={styles.Button}
              focusableWhenDisabled
              disabled={copied}
              onClick={handleCopy}
              aria-label="Copy to clipboard"
            />
          }
        >
          {copied ? (
            <CheckIcon className={styles.Icon} />
          ) : (
            <ClipboardIcon className={styles.Icon} />
          )}
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner sideOffset={8}>
            <Tooltip.Popup className={styles.Tooltip}>
              <Tooltip.Arrow className={styles.Arrow}>
                <ArrowSvg />
              </Tooltip.Arrow>
              Copy
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
      <Toast.Portal>
        <Toast.Viewport className={styles.Viewport}>
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </React.Fragment>
  );
}

function ToastList() {
  const { toasts } = Toast.useToastManager();
  const anchoredToasts = toasts.filter((toast) => toast.positionerProps);
  return anchoredToasts.map((toast) => (
    <Toast.Positioner key={toast.id} toast={toast}>
      <Toast.Root toast={toast} className={styles.Toast}>
        <Toast.Arrow className={styles.Arrow}>
          <ArrowSvg />
        </Toast.Arrow>
        <Toast.Content>
          <Toast.Description />
        </Toast.Content>
      </Toast.Root>
    </Toast.Positioner>
  ));
}

function ArrowSvg(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="20" height="10" viewBox="0 0 20 10" fill="none" {...props}>
      <path
        d="M9.66437 2.60207L4.80758 6.97318C4.07308 7.63423 3.11989 8 2.13172 8H0V10H20V8H18.5349C17.5468 8 16.5936 7.63423 15.8591 6.97318L11.0023 2.60207C10.622 2.2598 10.0447 2.25979 9.66437 2.60207Z"
        className={styles.ArrowFill}
      />
      <path
        d="M8.99542 1.85876C9.75604 1.17425 10.9106 1.17422 11.6713 1.85878L16.5281 6.22989C17.0789 6.72568 17.7938 7.00001 18.5349 7.00001L15.89 7L11.0023 2.60207C10.622 2.2598 10.0447 2.2598 9.66436 2.60207L4.77734 7L2.13171 7.00001C2.87284 7.00001 3.58774 6.72568 4.13861 6.22989L8.99542 1.85876Z"
        className={styles.ArrowOuterStroke}
      />
      <path
        d="M10.3333 3.34539L5.47654 7.71648C4.55842 8.54279 3.36693 9 2.13172 9H0V8H2.13172C3.11989 8 4.07308 7.63423 4.80758 6.97318L9.66437 2.60207C10.0447 2.25979 10.622 2.2598 11.0023 2.60207L15.8591 6.97318C16.5936 7.63423 17.5468 8 18.5349 8H20V9H18.5349C17.2998 9 16.1083 8.54278 15.1901 7.71648L10.3333 3.34539Z"
        className={styles.ArrowInnerStroke}
      />
    </svg>
  );
}

function ClipboardIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </svg>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
