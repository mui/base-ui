'use client';
import * as React from 'react';
import { Toast } from '@base-ui-components/react/toast';
import styles from './index.module.css';

export default function VaryingHeightsToast() {
  return (
    <Toast.Provider>
      <ToastButton />
      <Toast.Portal>
        <ViewportWithTopHeight className={styles.Viewport}>
          <ToastList />
        </ViewportWithTopHeight>
      </Toast.Portal>
    </Toast.Provider>
  );
}

function ViewportWithTopHeight(props: React.ComponentProps<typeof Toast.Viewport>) {
  const { toasts } = Toast.useToastManager();
  const topHeight = toasts[0]?.height ?? 0;

  return (
    <Toast.Viewport
      {...props}
      style={{
        ...props.style,
        // Shared collapsed height for the stack: height of index 0
        ['--toast-index-0-height' as string]: topHeight ? `${topHeight}px` : undefined,
      }}
    />
  );
}

function ToastButton() {
  const toastManager = Toast.useToastManager();
  const [count, setCount] = React.useState(0);

  const texts = React.useMemo(
    () => [
      'Short message.',
      'A bit longer message that spans two lines.',
      'This is a longer description that intentionally takes more vertical space to demonstrate stacking with varying heights.',
      'An even longer description that should span multiple lines so we can verify the clamped collapsed height and smooth expansion animation when hovering or focusing the viewport.',
    ],
    [],
  );

  function createToast() {
    setCount((prev) => prev + 1);
    const description = texts[Math.floor(Math.random() * texts.length)];
    toastManager.add({
      title: `Toast ${count + 1} created`,
      description,
      timeout: 0,
    });
  }

  return (
    <button type="button" className={styles.Button} onClick={createToast}>
      Create varying height toast
    </button>
  );
}

function ToastList() {
  const { toasts } = Toast.useToastManager();
  const topHeight = toasts[0]?.height ?? 0;
  return toasts.map((toast) => (
    <Toast.Root
      key={toast.id}
      toast={toast}
      className={styles.Toast}
      style={{
        ['--toast-height' as string]: toast.height ? `${toast.height}px` : undefined,
        ['--toast-index-0-height' as string]: topHeight ? `${topHeight}px` : undefined,
      }}
    >
      <Toast.Title className={styles.Title} />
      <Toast.Description className={styles.Description} />
      <Toast.Close className={styles.Close} aria-label="Close">
        <XIcon className={styles.Icon} />
      </Toast.Close>
    </Toast.Root>
  ));
}

function XIcon(props: React.ComponentProps<'svg'>) {
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
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
