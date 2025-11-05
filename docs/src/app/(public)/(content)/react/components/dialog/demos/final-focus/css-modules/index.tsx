'use client';
import * as React from 'react';
import { Dialog } from '@base-ui-components/react/dialog';
import styles from '../../_index.module.css';

export default function ExampleDialog() {
  const finalFocusRef = React.useRef<HTMLButtonElement | null>(null);
  return (
    <div className={styles.Container}>
      <Dialog.Root>
        <Dialog.Trigger className={styles.Button}>Open dialog</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop className={styles.Backdrop} />
          <Dialog.Popup className={styles.Popup} finalFocus={finalFocusRef}>
            <Dialog.Title className={styles.Title}>Notifications</Dialog.Title>
            <Dialog.Description className={styles.Description}>
              You are all caught up. Good job!
            </Dialog.Description>
            <div className={styles.Actions}>
              <Dialog.Close className={styles.Button}>Close</Dialog.Close>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
      <button ref={finalFocusRef} className={styles.Button}>
        Final focus
      </button>
    </div>
  );
}
