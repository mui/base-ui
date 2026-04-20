import * as React from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { benchmark } from '@mui/internal-benchmark';
import { createRows, MountList } from './shared';
import styles from './styles/dialog.module.css';

const dialogRows = createRows(300, 'Dialog');

function DialogMountList() {
  return (
    <MountList rows={dialogRows}>
      {(row) => (
        <Dialog.Root key={row.id}>
          <Dialog.Trigger aria-label={`Open ${row.label}`} className={styles.Button}>
            {row.label}
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Backdrop className={styles.Backdrop} />
            <Dialog.Popup className={styles.Popup}>
              <Dialog.Title className={styles.Title}>{row.label}</Dialog.Title>
              <Dialog.Description className={styles.Description}>Dialog content</Dialog.Description>
              <div className={styles.Actions}>
                <Dialog.Close className={styles.Button}>Close</Dialog.Close>
              </div>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </MountList>
  );
}

benchmark('Dialog mount (300 instances)', () => <DialogMountList />);
