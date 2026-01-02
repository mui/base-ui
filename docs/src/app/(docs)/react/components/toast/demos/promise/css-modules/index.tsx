'use client';
import * as React from 'react';
import { Toast } from '@base-ui/react/toast';
import styles from './index.module.css';

export default function PromiseToastExample() {
  return (
    <Toast.Provider>
      <PromiseDemo />
      <Toast.Portal>
        <Toast.Viewport className={styles.Viewport}>
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  );
}

function PromiseDemo() {
  const toastManager = Toast.useToastManager();

  function runPromise() {
    toastManager.promise(
      // Simulate an API request with a promise that resolves after 2 seconds
      new Promise<string>((resolve, reject) => {
        const shouldSucceed = Math.random() > 0.3; // 70% success rate
        setTimeout(() => {
          if (shouldSucceed) {
            resolve('operation completed');
          } else {
            reject(new Error('operation failed'));
          }
        }, 2000);
      }),
      {
        loading: 'Loading data…',
        success: (data: string) => `Success: ${data}`,
        error: (err: Error) => `Error: ${err.message}`,
      },
    );
  }

  return (
    <button type="button" onClick={runPromise} className={styles.Button}>
      Run promise
    </button>
  );
}

function ToastList() {
  const { toasts } = Toast.useToastManager();
  return toasts.map((toast) => (
    <Toast.Root key={toast.id} toast={toast} className={styles.Toast}>
      <Toast.Content className={styles.Content}>
        <Toast.Title className={styles.Title} />
        <Toast.Description className={styles.Description} />
        <Toast.Close className={styles.Close} aria-label="Close">
          <XIcon className={styles.Icon} />
        </Toast.Close>
      </Toast.Content>
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
