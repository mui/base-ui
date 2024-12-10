import * as React from 'react';
import { AlertDialog } from '@base-ui-components/react/alert-dialog';
import styles from './index.module.css';

export default function ExampleAlertDialog() {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger data-color="red" className={styles.Button}>
        Discard draft
      </AlertDialog.Trigger>
      <AlertDialog.Backdrop className={styles.Backdrop} />
      <AlertDialog.Popup className={styles.Popup}>
        <AlertDialog.Title className={styles.Title}>
          Discard draft?
        </AlertDialog.Title>
        <AlertDialog.Description className={styles.Description}>
          You can't undo this action.
        </AlertDialog.Description>
        <div className={styles.Actions}>
          <AlertDialog.Close className={styles.Button}>Cancel</AlertDialog.Close>
          <AlertDialog.Close data-color="red" className={styles.Button}>
            Discard
          </AlertDialog.Close>
        </div>
      </AlertDialog.Popup>
    </AlertDialog.Root>
  );
}
