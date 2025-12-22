'use client';
import * as React from 'react';
import { Dialog } from '@base-ui/react/dialog';
import styles from '../../_index.module.css';

const demoDialog = Dialog.createHandle();

export default function DialogDetachedTriggersSimpleDemo() {
  return (
    <React.Fragment>
      <Dialog.Trigger className={styles.Button} handle={demoDialog}>
        View notifications
      </Dialog.Trigger>

      <Dialog.Root handle={demoDialog}>
        <Dialog.Portal>
          <Dialog.Backdrop className={styles.Backdrop} />
          <Dialog.Popup className={styles.Popup}>
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
    </React.Fragment>
  );
}
