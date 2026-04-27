import { Dialog } from '@base-ui/react/dialog';

export default function ExampleDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger className="flex h-8 items-center justify-center border border-gray-950 dark:border-white bg-white dark:bg-gray-950 px-3 text-sm font-normal text-gray-950 dark:text-white select-none hover:bg-gray-50 dark:hover:bg-gray-900 active:bg-gray-100 dark:active:bg-gray-800 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-800">
        View notifications
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 min-h-dvh bg-black opacity-20 transition-opacity duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 dark:opacity-50 supports-[-webkit-touch-callout:none]:absolute" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 -mt-8 w-96 max-w-[calc(100vw-3rem)] -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-950 p-3 text-gray-950 dark:text-white border border-gray-950 dark:border-white shadow-[4px_4px_0] shadow-black/12 dark:shadow-none transition-[scale,opacity] duration-100 ease-out data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0">
          <Dialog.Title className="text-sm font-bold">Notifications</Dialog.Title>
          <Dialog.Description className="text-sm text-gray-600 dark:text-gray-400">
            You are all caught up. Good job!
          </Dialog.Description>
          <div className="flex justify-end gap-3 mt-4">
            <Dialog.Close className="flex h-8 items-center justify-center border border-gray-950 dark:border-white bg-white dark:bg-gray-950 px-3 text-sm font-normal text-gray-950 dark:text-white select-none hover:bg-gray-50 dark:hover:bg-gray-900 active:bg-gray-100 dark:active:bg-gray-800 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-800">
              Close
            </Dialog.Close>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
