'use client';
import * as React from 'react';
import { Toast } from '@base-ui-components/react/toast';
import styles from './index.module.css';

export default function UndoToastExample() {
  return (
    <Toast.Provider>
      <SaveForm />
      <Toast.Viewport className={styles.Viewport} data-position="top">
        <ToastList />
      </Toast.Viewport>
    </Toast.Provider>
  );
}

function SaveForm() {
  const toast = Toast.useToast();

  function action() {
    const id = toast.add({
      title: 'Action performed',
      description: 'You can undo this action.',
      type: 'success',
      actionProps: {
        children: 'Undo',
        onClick() {
          toast.remove(id);
          toast.add({
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
        {toast.actionProps && (
          <div className={styles.Actions}>
            <button
              {...toast.actionProps}
              type="button"
              className={styles.UndoButton}
            />
          </div>
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
