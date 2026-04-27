'use client';
import * as React from 'react';
import { Dialog } from '@base-ui/react/dialog';

const demoDialog = Dialog.createHandle<number>();

export default function DialogDetachedTriggersControlledDemo() {
  const [open, setOpen] = React.useState(false);
  const [triggerId, setTriggerId] = React.useState<string | null>(null);

  const handleOpenChange = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setOpen(isOpen);
    setTriggerId(eventDetails.trigger?.id ?? null);
  };

  return (
    <React.Fragment>
      <div className="flex flex-wrap gap-2 justify-center">
        <Dialog.Trigger
          className="flex h-8 items-center justify-center border border-gray-950 dark:border-white bg-white dark:bg-gray-950 px-3 text-sm font-normal text-gray-950 dark:text-white select-none hover:bg-gray-50 dark:hover:bg-gray-900 active:bg-gray-100 dark:active:bg-gray-800 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-800"
          handle={demoDialog}
          id="trigger-1"
          payload={1}
        >
          Open 1
        </Dialog.Trigger>

        <Dialog.Trigger
          className="flex h-8 items-center justify-center border border-gray-950 dark:border-white bg-white dark:bg-gray-950 px-3 text-sm font-normal text-gray-950 dark:text-white select-none hover:bg-gray-50 dark:hover:bg-gray-900 active:bg-gray-100 dark:active:bg-gray-800 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-800"
          handle={demoDialog}
          id="trigger-2"
          payload={2}
        >
          Open 2
        </Dialog.Trigger>

        <Dialog.Trigger
          className="flex h-8 items-center justify-center border border-gray-950 dark:border-white bg-white dark:bg-gray-950 px-3 text-sm font-normal text-gray-950 dark:text-white select-none hover:bg-gray-50 dark:hover:bg-gray-900 active:bg-gray-100 dark:active:bg-gray-800 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-800"
          handle={demoDialog}
          id="trigger-3"
          payload={3}
        >
          Open 3
        </Dialog.Trigger>

        <button
          type="button"
          className="flex h-8 items-center justify-center border border-gray-950 dark:border-white bg-white dark:bg-gray-950 px-3 text-sm font-normal text-gray-950 dark:text-white select-none hover:bg-gray-50 dark:hover:bg-gray-900 active:bg-gray-100 dark:active:bg-gray-800 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-800"
          onClick={() => {
            setTriggerId('trigger-2');
            setOpen(true);
          }}
        >
          Open programmatically
        </button>
      </div>

      <Dialog.Root
        handle={demoDialog}
        open={open}
        onOpenChange={handleOpenChange}
        triggerId={triggerId}
      >
        {({ payload }) => (
          <Dialog.Portal>
            <Dialog.Backdrop className="fixed inset-0 min-h-dvh bg-black opacity-20 transition-opacity duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 dark:opacity-50 supports-[-webkit-touch-callout:none]:absolute" />
            <Dialog.Popup className="fixed top-1/2 left-1/2 -mt-8 w-96 max-w-[calc(100vw-3rem)] -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-950 p-3 text-gray-950 dark:text-white border border-gray-950 dark:border-white shadow-[4px_4px_0] shadow-black/12 dark:shadow-none transition-[scale,opacity] duration-100 ease-out data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0">
              {payload !== undefined && (
                <Dialog.Title className="text-sm font-bold">Dialog {payload}</Dialog.Title>
              )}

              <div className="flex justify-end gap-3 mt-4">
                <Dialog.Close className="flex h-8 items-center justify-center border border-gray-950 dark:border-white bg-white dark:bg-gray-950 px-3 text-sm font-normal text-gray-950 dark:text-white select-none hover:bg-gray-50 dark:hover:bg-gray-900 active:bg-gray-100 dark:active:bg-gray-800 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-800">
                  Close
                </Dialog.Close>
              </div>
            </Dialog.Popup>
          </Dialog.Portal>
        )}
      </Dialog.Root>
    </React.Fragment>
  );
}
