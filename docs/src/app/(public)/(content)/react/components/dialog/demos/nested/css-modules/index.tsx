import * as React from 'react';
import { Dialog } from '@base-ui-components/react/dialog';
import styles from './index.module.css';

export default function ExampleDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger className={styles.Button}>View notifications</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.Backdrop} />
        <Dialog.Popup className={styles.Popup}>
          <Dialog.Title className={styles.Title}>Notifications</Dialog.Title>
          <Dialog.Description className={styles.Description}>
            You are all caught up. Good job!
          </Dialog.Description>
          <div className={styles.Actions}>
            <div className={styles.ActionsLeft}>
              <Dialog.Root>
                <Dialog.Trigger className={styles.GhostButton}>
                  Customize
                </Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Popup className={styles.Popup}>
                    <Dialog.Title className={styles.Title}>
                      Customize notifications
                    </Dialog.Title>
                    <Dialog.Description className={styles.Description}>
                      Review your settings here.
                    </Dialog.Description>
                    <div className={styles.Actions}>
                      <Dialog.Close className={styles.Button}>Close</Dialog.Close>
                    </div>
                  </Dialog.Popup>
                </Dialog.Portal>
              </Dialog.Root>
            </div>

            <Dialog.Close className={styles.Button}>Close</Dialog.Close>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
