'use client';
import * as React from 'react';
import { Toast } from '@base-ui-components/react/toast';
import styles from './index.module.css';

function isCustomToast(
  toast: Toast.useToast.ToastType<CustomToastData>,
): toast is Toast.useToast.ToastType<CustomToastData> {
  return toast.data?.userId !== undefined;
}

export default function CustomToastExample() {
  return (
    <Toast.Provider>
      <CustomToast />
      <Toast.Viewport className={styles.Viewport} data-position="top">
        <ToastList />
      </Toast.Viewport>
    </Toast.Provider>
  );
}

interface CustomToastData {
  userId: string;
  onNotify: () => void;
}

function CustomToast() {
  const toast = Toast.useToast();

  function action() {
    const data: CustomToastData = {
      userId: '123',
      onNotify() {
        // eslint-disable-next-line no-alert
        alert('Notified 123');
      },
    };

    toast.add({
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
  const { toasts } = Toast.useToast();

  return toasts.map((toast) => (
    <Toast.Root
      key={toast.id}
      toast={toast}
      className={styles.Toast}
      data-position="top"
      swipeDirection="up"
    >
      <Toast.Content className={styles.Content}>
        {toast.title && (
          <Toast.Title className={styles.Title}>{toast.title}</Toast.Title>
        )}
        {toast.description && (
          <Toast.Description className={styles.Description}>
            {toast.description}
          </Toast.Description>
        )}
        {isCustomToast(toast) && toast.data && (
          <button
            type="button"
            className={styles.Button}
            onClick={toast.data.onNotify}
          >
            Notify userId {toast.data.userId}
          </button>
        )}
      </Toast.Content>
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
