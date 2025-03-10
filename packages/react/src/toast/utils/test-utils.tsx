import * as React from 'react';
import { Toast } from '@base-ui-components/react/toast';

export function Button() {
  const { add } = Toast.useToast();
  return (
    <button
      type="button"
      onClick={() => {
        add({
          title: 'title',
          description: 'description',
        });
      }}
    >
      add
    </button>
  );
}

export function List() {
  return Toast.useToast().toasts.map((toastItem) => (
    <Toast.Root key={toastItem.id} toast={toastItem} data-testid="root">
      <Toast.Title data-testid="title">{toastItem.title}</Toast.Title>
      <Toast.Description data-testid="description">{toastItem.description}</Toast.Description>
      <Toast.Close aria-label="close" />
    </Toast.Root>
  ));
}
