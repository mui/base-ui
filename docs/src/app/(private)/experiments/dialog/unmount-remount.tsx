'use client';
import * as React from 'react';
import clsx from 'clsx';
import { Dialog } from '@base-ui/react/dialog';
import demoStyles from 'docs/src/app/(docs)/react/components/dialog/demos/hero/css-modules/index.module.css';
import styles from './dialog.module.css';

const dialogHandle = Dialog.createHandle();

export default function DialogUnmountRemountExperiment() {
  const [mounted, setMounted] = React.useState(true);
  const [mountCount, setMountCount] = React.useState(1);

  function remountDialog() {
    setMountCount((count) => count + 1);
    setMounted(true);
  }

  return (
    <div className={styles.Page}>
      <h1>Dialog unmount/remount with handle</h1>

      <div className={styles.Container}>
        <Dialog.Trigger
          handle={dialogHandle}
          id="unmount-remount-trigger-1"
          className={clsx(demoStyles.Button, styles.Button)}
          disabled={!mounted}
        >
          Open dialog
        </Dialog.Trigger>

        <Dialog.Trigger
          handle={dialogHandle}
          id="unmount-remount-trigger-2"
          className={clsx(demoStyles.Button, styles.Button)}
          disabled={!mounted}
        >
          Open dialog from second trigger
        </Dialog.Trigger>

        <button
          type="button"
          className={clsx(demoStyles.Button, styles.Button)}
          onClick={() => setMounted(false)}
          disabled={!mounted}
        >
          Unmount dialog subtree
        </button>

        <button
          type="button"
          className={clsx(demoStyles.Button, styles.Button)}
          onClick={remountDialog}
          disabled={mounted}
        >
          Remount dialog subtree
        </button>
      </div>

      <div className={styles.DialogSection}>
        <p>
          Mount state: {mounted ? 'mounted' : 'unmounted'} (mount #{mountCount})
        </p>
        <p>
          Open the dialog, press "Unmount dialog subtree" inside it, then remount it. The
          module-scoped handle should not preserve the pre-unmount open state.
        </p>
      </div>

      {mounted && <ReproDialog key={mountCount} onUnmount={() => setMounted(false)} />}
    </div>
  );
}

interface ReproDialogProps {
  onUnmount: () => void;
}

function ReproDialog(props: ReproDialogProps) {
  return (
    <Dialog.Root handle={dialogHandle}>
      <Dialog.Portal>
        <Dialog.Backdrop className={demoStyles.Backdrop} />
        <Dialog.Popup className={demoStyles.Popup}>
          <Dialog.Title className={demoStyles.Title}>Dialog with handle</Dialog.Title>
          <Dialog.Description className={demoStyles.Description}>
            This dialog is unmounted while open, then mounted again with the same handle.
          </Dialog.Description>

          <div className={styles.DialogSection}>
            <p>This simulates navigating away while a detached-trigger dialog is open.</p>
          </div>

          <div className={clsx(demoStyles.Actions, styles.Actions)}>
            <button
              type="button"
              className={clsx(demoStyles.Button, styles.Button)}
              onClick={props.onUnmount}
            >
              Unmount dialog subtree
            </button>
            <Dialog.Close className={clsx(demoStyles.Button, styles.Button)}>Close</Dialog.Close>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
