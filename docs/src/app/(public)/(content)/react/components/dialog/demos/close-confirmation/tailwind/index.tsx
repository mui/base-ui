import * as React from 'react';
import { Dialog } from '@base-ui-components/react/dialog';

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
      <Dialog.Trigger className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium text-gray-900 select-none hover:bg-gray-100 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100">
        Set team name
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black opacity-20 transition-all duration-150 dark:opacity-70 [[data-starting-style],[data-ending-style]]:opacity-0" />
        <Dialog.Popup className="fixed top-[calc(50%-1rem*var(--nested-dialogs))] left-1/2 -mt-8 w-96 max-w-[calc(100vw-3rem)] -translate-x-1/2 -translate-y-1/2 scale-[calc(1-0.1*var(--nested-dialogs))] rounded-lg bg-gray-50 p-6 text-gray-900 outline outline-gray-200 transition-all duration-150 data-[has-nested-dialogs]:after:absolute data-[has-nested-dialogs]:after:inset-0 data-[has-nested-dialogs]:after:rounded-[inherit] data-[has-nested-dialogs]:after:bg-black/5 dark:outline-gray-300 [[data-starting-style],[data-ending-style]]:scale-90 [[data-starting-style],[data-ending-style]]:opacity-0">
          <Dialog.Title className="-mt-1.5 mb-1 text-lg font-medium">
            Team name
          </Dialog.Title>
          <Dialog.Description className="mb-4 text-base text-gray-600">
            Visible on your profile.
          </Dialog.Description>

          <form
            className="mb-2 flex items-center justify-end gap-4"
            onSubmit={(event) => {
              event.preventDefault();

              // Close the main dialog when submitting
              setDialogOpen(false);
              setTeamName(inputValue);
            }}
          >
            <input
              className="h-10 max-w-64 grow rounded-md border border-gray-200 pl-3.5 text-base text-gray-900 focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800"
              placeholder="Enter your team name"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
            />
            <button
              type="submit"
              disabled={!inputValue}
              className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium text-gray-900 select-none hover:bg-gray-100 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100 disabled:bg-gray-50 disabled:text-gray-400"
            >
              Save
            </button>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>

      {/* Confirmation dialog */}
      <Dialog.Root open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <Dialog.Portal>
          <Dialog.Popup className="fixed top-[calc(50%-1rem*var(--nested-dialogs))] left-1/2 -mt-8 w-96 max-w-[calc(100vw-3rem)] -translate-x-1/2 -translate-y-1/2 scale-[calc(1-0.1*var(--nested-dialogs))] rounded-lg bg-gray-50 p-6 text-gray-900 outline outline-gray-200 transition-all duration-150 data-[has-nested-dialogs]:after:absolute data-[has-nested-dialogs]:after:inset-0 data-[has-nested-dialogs]:after:rounded-[inherit] data-[has-nested-dialogs]:after:bg-black/5 dark:outline-gray-300 [[data-starting-style],[data-ending-style]]:scale-90 [[data-starting-style],[data-ending-style]]:opacity-0">
            <Dialog.Title className="-mt-1.5 mb-1 text-lg font-medium">
              {teamName ? 'Discard changes?' : 'Continue without a team name?'}
            </Dialog.Title>
            <Dialog.Description className="mb-6 text-base text-gray-600">
              {teamName
                ? 'Your team name won’t be changed.'
                : 'You’ll have to add the team name later.'}
            </Dialog.Description>
            <div className="flex items-center justify-end gap-4">
              <Dialog.Close className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium text-gray-900 select-none hover:bg-gray-100 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100">
                Go back
              </Dialog.Close>
              <button
                type="button"
                className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium text-gray-900 select-none hover:bg-gray-100 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100"
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
