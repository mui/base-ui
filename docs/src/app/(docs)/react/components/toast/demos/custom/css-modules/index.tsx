'use client';
import * as React from 'react';
import { Toast } from '@base-ui/react/toast';
import styles from './index.module.css';

interface CustomToastData {
  userId: string;
}

function isCustomToast(
  toast: Toast.Root.ToastObject,
): toast is Toast.Root.ToastObject<CustomToastData> {
  return toast.data?.userId !== undefined;
}

export default function CustomToastExample() {
  return (
    <Toast.Provider>
      <CustomToast />
      <Toast.Portal>
        <Toast.Viewport className={styles.Viewport}>
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  );
}

function CustomToast() {
  const toastManager = Toast.useToastManager();

  function action() {
    const data: CustomToastData = {
      userId: '123',
    };

    toastManager.add({
      title: 'Toast with custom data',
      data,
    });
  }

  return (
    <button type="button" onClick={action} className={styles.Button}>
      Create custom toast
    </button>
  );
}

function ToastList() {
  const { toasts } = Toast.useToastManager();
  return toasts.map((toast) => (
    <Toast.Root key={toast.id} toast={toast} className={styles.Toast}>
      <Toast.Content className={styles.Content}>
        <Toast.Title className={styles.Title}>{toast.title}</Toast.Title>
        {isCustomToast(toast) && toast.data ? (
          <Toast.Description className={styles.Description}>
            `data.userId` is {toast.data.userId}
          </Toast.Description>
        ) : (
          <Toast.Description className={styles.Description} />
        )}
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
