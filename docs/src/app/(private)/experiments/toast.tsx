'use client';
import * as React from 'react';
import { Toast, useToast } from '@base-ui-components/react/toast';

export default function Page() {
  return (
    <Toast.Provider>
      <Toast.Viewport
        style={{
          position: 'fixed',
          left: '50%',
          top: 50,
          transform: 'translatex(-50%)',
        }}
      >
        <Toasts />
      </Toast.Viewport>
      <CreateToast />
    </Toast.Provider>
  );
}

function Toasts() {
  const { toasts } = useToast();
  return toasts.map((toast) => (
    <Toast.Root key={toast.id} toast={toast}>
      <Toast.Content>
        <Toast.Description>{toast.description}</Toast.Description>
      </Toast.Content>
      <Toast.Close>Close</Toast.Close>
    </Toast.Root>
  ));
}

function CreateToast() {
  const toast = useToast();
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
