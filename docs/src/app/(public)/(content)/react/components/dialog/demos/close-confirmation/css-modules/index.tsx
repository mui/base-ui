import * as React from 'react';
import { Dialog } from '@base-ui-components/react/dialog';
import styles from './index.module.css';

export default function ExampleDialog() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [confirmationOpen, setConfirmationOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const [teamName, setTeamName] = React.useState('');

  // Show the close confirmation if the team name is empty or if the new name wasn't saved
  const shouldConfirmChanges = !teamName || inputValue !== teamName;

  return (
    <Dialog.Root
      open={dialogOpen}
      onOpenChange={(open) => {
        if (!open && shouldConfirmChanges) {
          setConfirmationOpen(true);
        } else {
          setDialogOpen(open);

          // Reset the input value when the dialog opens
          setInputValue(teamName);
        }
      }}
    >
      <Dialog.Trigger className={styles.Button}>Set team name</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.Backdrop} />
        <Dialog.Popup className={styles.Popup}>
          <Dialog.Title className={styles.Title}>Team name</Dialog.Title>
          <Dialog.Description className={styles.Description}>
            Visible on your profile.
          </Dialog.Description>

          <form
            className={styles.InputContainer}
            onSubmit={(event) => {
              event.preventDefault();

              // Close the main dialog when submitting
              setDialogOpen(false);
              setTeamName(inputValue);
            }}
          >
            <input
              className={styles.Input}
              placeholder="Enter your team name"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
            />
            <button type="submit" disabled={!inputValue} className={styles.Button}>
              Save
            </button>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>

      {/* Confirmation dialog */}
      <Dialog.Root open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <Dialog.Portal>
          <Dialog.Popup className={styles.Popup}>
            <Dialog.Title className={styles.Title}>
              {teamName ? 'Discard changes?' : 'Continue without a team name?'}
            </Dialog.Title>
            <Dialog.Description className={styles.Description}>
              {teamName
                ? 'Your team name won’t be changed.'
                : 'You’ll have to add the team name later.'}
            </Dialog.Description>
            <div className={styles.Actions}>
              <Dialog.Close className={styles.Button}>Go back</Dialog.Close>
              <button
                type="button"
                className={styles.Button}
                onClick={() => {
                  setConfirmationOpen(false);
                  setDialogOpen(false);
                }}
              >
                Confirm
              </button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </Dialog.Root>
  );
}
