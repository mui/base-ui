import * as React from 'react';
import { AlertDialog } from '@base-ui-components/react/alert-dialog';
import { Dialog } from '@base-ui-components/react/dialog';
import styles from './index.module.css';

export default function ExampleDialog() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [confirmationOpen, setConfirmationOpen] = React.useState(false);
  const [textareaValue, setTextareaValue] = React.useState('');

  return (
    <Dialog.Root
      open={dialogOpen}
      onOpenChange={(open) => {
        // Show the close confirmation if there’s text in the textarea
        if (!open && textareaValue) {
          setConfirmationOpen(true);
        } else {
          // Reset the text area value
          setTextareaValue('');
          // Open or close the dialog normally
          setDialogOpen(open);
        }
      }}
    >
      <Dialog.Trigger className={styles.Button}>Tweet</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.Backdrop} />
        <Dialog.Popup className={styles.Popup}>
          <Dialog.Title className={styles.Title}>New tweet</Dialog.Title>
          <form
            className={styles.TextareaContainer}
            onSubmit={(event) => {
              event.preventDefault();
              // Close the dialog when submitting
              setDialogOpen(false);
            }}
          >
            <textarea
              required
              className={styles.Textarea}
              placeholder="What’s on your mind?"
              value={textareaValue}
              onChange={(event) => setTextareaValue(event.target.value)}
            />
            <div className={styles.Actions}>
              <Dialog.Close className={styles.Button}>Cancel</Dialog.Close>
              <button type="submit" className={styles.Button}>
                Tweet
              </button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>

      {/* Confirmation dialog */}
      <AlertDialog.Root open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Popup className={styles.Popup}>
            <AlertDialog.Title className={styles.Title}>
              Discard tweet?
            </AlertDialog.Title>
            <AlertDialog.Description className={styles.Description}>
              Your tweet will be lost.
            </AlertDialog.Description>
            <div className={styles.Actions}>
              <AlertDialog.Close className={styles.Button}>
                Go back
              </AlertDialog.Close>
              <button
                type="button"
                className={styles.Button}
                onClick={() => {
                  setConfirmationOpen(false);
                  setDialogOpen(false);
                }}
              >
                Discard
              </button>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </Dialog.Root>
  );
}
