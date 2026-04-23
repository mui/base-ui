'use client';
import * as React from 'react';
import { AlertDialog } from '@base-ui/react/alert-dialog';
import { Dialog } from '@base-ui/react/dialog';

export default function ExampleDialog() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [confirmationOpen, setConfirmationOpen] = React.useState(false);
  const [textareaValue, setTextareaValue] = React.useState('');
  const titleId = React.useId();

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
      <Dialog.Trigger className="flex h-8 items-center justify-center bg-gray-200 dark:bg-gray-800 px-3 text-sm font-normal text-gray-950 dark:text-white select-none hover:bg-gray-300 dark:hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800">
        Tweet
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 min-h-dvh bg-black opacity-20 transition-opacity duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 dark:opacity-70 supports-[-webkit-touch-callout:none]:absolute" />
        <Dialog.Popup className="fixed top-[calc(50%+1.25rem*var(--nested-dialogs))] left-1/2 -mt-8 w-96 max-w-[calc(100vw-3rem)] -translate-x-1/2 -translate-y-1/2 scale-[calc(1-0.1*var(--nested-dialogs))] bg-white dark:bg-gray-950 p-3 text-gray-950 dark:text-white border border-gray-950 dark:border-white shadow-[4px_4px_0] shadow-black/12 dark:shadow-none transition-all duration-150 data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[nested-dialog-open]:after:absolute data-[nested-dialog-open]:after:inset-0 data-[nested-dialog-open]:after:bg-black/5 data-[starting-style]:scale-90 data-[starting-style]:opacity-0">
          <Dialog.Title id={titleId} className="text-sm font-bold">
            New tweet
          </Dialog.Title>
          <form
            className="mt-4 flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              // Close the dialog when submitting
              setDialogOpen(false);
            }}
          >
            <textarea
              aria-labelledby={titleId}
              required
              className="min-h-32 w-full border border-gray-950 dark:border-white bg-transparent px-3 py-2 text-sm leading-5 text-gray-950 dark:text-white placeholder:text-gray-600 dark:placeholder:text-gray-400 focus:outline-2 focus:outline-offset-2 focus:outline-blue-800"
              placeholder="What’s on your mind?"
              value={textareaValue}
              onChange={(event) => setTextareaValue(event.target.value)}
            />
            <div className="flex justify-end gap-3">
              <Dialog.Close className="flex h-8 items-center justify-center bg-gray-200 dark:bg-gray-800 px-3 text-sm font-normal text-gray-950 dark:text-white select-none hover:bg-gray-300 dark:hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800">
                Cancel
              </Dialog.Close>
              <button
                type="submit"
                className="flex h-8 items-center justify-center bg-gray-200 dark:bg-gray-800 px-3 text-sm font-normal text-gray-950 dark:text-white select-none hover:bg-gray-300 dark:hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800"
              >
                Tweet
              </button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>

      {/* Confirmation dialog */}
      <AlertDialog.Root open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Popup className="fixed top-[calc(50%+1.25rem*var(--nested-dialogs))] left-1/2 -mt-8 w-96 max-w-[calc(100vw-3rem)] -translate-x-1/2 -translate-y-1/2 scale-[calc(1-0.1*var(--nested-dialogs))] bg-white dark:bg-gray-950 p-3 text-gray-950 dark:text-white border border-gray-950 dark:border-white shadow-[4px_4px_0] shadow-black/12 dark:shadow-none transition-all duration-150 data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[nested-dialog-open]:after:absolute data-[nested-dialog-open]:after:inset-0 data-[nested-dialog-open]:after:bg-black/5 data-[starting-style]:scale-90 data-[starting-style]:opacity-0">
            <AlertDialog.Title className="text-sm font-bold">Discard tweet?</AlertDialog.Title>
            <AlertDialog.Description className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Your tweet will be lost.
            </AlertDialog.Description>
            <div className="flex justify-end gap-3">
              <AlertDialog.Close className="flex h-8 items-center justify-center bg-gray-200 dark:bg-gray-800 px-3 text-sm font-normal text-gray-950 dark:text-white select-none hover:bg-gray-300 dark:hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800">
                Go back
              </AlertDialog.Close>
              <button
                type="button"
                className="flex h-8 items-center justify-center bg-gray-200 dark:bg-gray-800 px-3 text-sm font-normal text-gray-950 dark:text-white select-none hover:bg-gray-300 dark:hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800"
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
