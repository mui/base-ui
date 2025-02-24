'use client';
import * as React from 'react';
import { Toast } from '@base-ui-components/react/toast';
import styles from './toast.module.css';

function showGlobalToast() {
  Toast.add({
    title: 'Global Toast',
    description: 'This toast was created outside of a React component',
    type: 'message',
  });
}

function fetchUserData() {
  return new Promise((resolve, reject) => {
    // Simulate API call with a 50% chance of success
    setTimeout(() => {
      const success = Math.random() > 0.1;
      if (success) {
        resolve({ name: 'John Doe', email: 'john@example.com' });
      } else {
        reject(new Error('Failed to fetch user data'));
      }
    }, 1000);
  });
}

function ToastPromiseExample() {
  const { promise } = Toast.useToast();

  const handlePromiseClick = () => {
    promise(fetchUserData(), {
      loading: 'Fetching user data...',
      success: 'User data loaded!',
      error: 'Failed to load user data',
    })
      .then((data) => {
        console.log('User data:', data);
      })
      .catch((err) => {
        console.error('Error handled:', err);
      });
  };

  return (
    <button type="button" onClick={handlePromiseClick}>
      Try Toast Promise
    </button>
  );
}

export default function Page() {
  return (
    <Toast.Provider>
      <Toast.Viewport className={styles.viewport}>
        <Toasts />
      </Toast.Viewport>
      <CreateToast />

      <div
        style={{
          marginTop: '20px',
          display: 'flex',
          gap: '10px',
          justifyContent: 'center',
        }}
      >
        <button type="button" onClick={showGlobalToast}>
          Show Global Toast
        </button>
        <ToastPromiseExample />
      </div>
    </Toast.Provider>
  );
}

function Toasts() {
  const { toasts } = Toast.useToast();
  return toasts.map((toast) => (
    <Toast.Root key={toast.id} toast={toast} className={styles.root}>
      <Toast.Content>
        {toast.title && <div className={styles.title}>{toast.title}</div>}
        {toast.description && (
          <Toast.Description>{toast.description}</Toast.Description>
        )}
      </Toast.Content>
      <Toast.Close>Close</Toast.Close>
    </Toast.Root>
  ));
}

function CreateToast() {
  const toast = Toast.useToast();
  return (
    <button
      style={{ position: 'fixed', right: 20, bottom: 20 }}
      type="button"
      onClick={() => {
        toast.add({
          title: 'Title',
          description: 'Toast',
          type: 'error',
        });
      }}
    >
      Create toast
    </button>
  );
}
