import * as React from 'react';
import { AlertDialog } from '@base-ui-components/react/alert-dialog';

export default function ExampleAlertDialog() {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium text-red-800 select-none hover:bg-gray-100 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100">
        Discard draft
      </AlertDialog.Trigger>
      <AlertDialog.Backdrop className="fixed inset-0 bg-black opacity-20 transition-all duration-150 dark:opacity-70 [[data-starting-style],[data-ending-style]]:opacity-0" />
      <AlertDialog.Popup className="fixed top-1/2 left-1/2 -mt-8 w-96 max-w-[calc(100vw-3rem)] -translate-1/2 rounded-lg bg-gray-50 p-6 text-gray-900 outline outline-gray-200 transition-all duration-150 dark:outline-gray-300 [[data-starting-style],[data-ending-style]]:scale-90 [[data-starting-style],[data-ending-style]]:opacity-0">
        <AlertDialog.Title className="-mt-1.5 mb-1 text-lg font-medium">
          Discard draft?
        </AlertDialog.Title>
        <AlertDialog.Description className="mb-6 text-base text-gray-600">
          You can’t undo this action.
        </AlertDialog.Description>
        <div className="flex justify-end gap-4">
          <AlertDialog.Close className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium text-gray-900 select-none hover:bg-gray-100 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100">
            Cancel
          </AlertDialog.Close>
          <AlertDialog.Close className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium text-red-800 select-none hover:bg-gray-100 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100">
            Discard
          </AlertDialog.Close>
        </div>
      </AlertDialog.Popup>
    </AlertDialog.Root>
  );
}
