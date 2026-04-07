'use client';
import * as React from 'react';
import { Toast } from '@base-ui/react/toast';
import styles from './index.module.css';

export default function UndoToastExample() {
  return (
    <Toast.Provider>
      <Form />
      <Toast.Portal>
        <Toast.Viewport className={styles.Viewport}>
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  );
}

function Form() {
  const toastManager = Toast.useToastManager();

  function action() {
    const id = toastManager.add({
      title: 'Action performed',
      description: 'You can undo this action.',
      type: 'success',
      actionProps: {
        children: 'Undo',
        onClick() {
          toastManager.close(id);
          toastManager.add({
            title: 'Action undone',
          });
        },
      },
    });
  }

  return (
    <button type="button" onClick={action} className={styles.Button}>
      Perform action
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
        <Toast.Action className={styles.UndoButton} />
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
