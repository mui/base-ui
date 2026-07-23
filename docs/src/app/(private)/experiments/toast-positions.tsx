'use client';
import * as React from 'react';
import { Toast } from '@base-ui/react/toast';
import styles from './toast-positions.module.css';

const SWIPE_DIRECTIONS: Record<string, ('up' | 'down' | 'left' | 'right')[]> = {
  'top-right': ['up', 'right'],
  'bottom-right': ['down', 'right'],
  'bottom-left': ['down', 'left'],
};

const POSITIONS = Object.keys(SWIPE_DIRECTIONS);

export default function Page() {
  return (
    <Toast.Provider>
      <Toast.Viewport className={styles.viewport}>
        <Toasts />
      </Toast.Viewport>
      <Buttons />
    </Toast.Provider>
  );
}

function Buttons() {
  const toastManager = Toast.useToastManager();
  const countRef = React.useRef(0);

  function add(group: string) {
    countRef.current += 1;
    toastManager.add({
      group,
      title: `Toast ${countRef.current}`,
      description: `Anchored to ${group}`,
    });
  }

  return (
    <div className={styles.buttons}>
      <h1>Toast: multiple positions, one provider, one viewport</h1>
      {POSITIONS.map((position) => (
        <button
          key={position}
          className={styles.button}
          type="button"
          onClick={() => add(position)}
        >
          Add toast at {position}
        </button>
      ))}
      <button
        className={styles.button}
        type="button"
        onClick={() => add(POSITIONS[Math.floor(Math.random() * POSITIONS.length)])}
      >
        Add toast at random position
      </button>
    </div>
  );
}

function Toasts() {
  const { toasts } = Toast.useToastManager();
  return toasts.map((toast) => (
    <Toast.Root
      key={toast.id}
      toast={toast}
      className={styles.root}
      swipeDirection={SWIPE_DIRECTIONS[toast.group ?? 'bottom-right']}
    >
      <Toast.Content className={styles.content}>
        <div className={styles.text}>
          <Toast.Title className={styles.title} />
          <Toast.Description className={styles.description} />
        </div>
        <Toast.Close className={styles.close} aria-label="Close">
          ×
        </Toast.Close>
      </Toast.Content>
    </Toast.Root>
  ));
}
