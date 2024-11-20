import * as React from 'react';
import { Dialog } from '@base-ui-components/react/Dialog';

export default function ExampleDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger className="focus-visible:outline-blue flex rounded-md bg-gray-50 px-3.5 py-2 font-medium text-gray-900 outline-1 outline-gray-200 select-none hover:bg-gray-100 focus-visible:outline-2">
        View notifications
      </Dialog.Trigger>
      <Dialog.Backdrop className="fixed inset-0 bg-black opacity-20 dark:opacity-70" />
      <Dialog.Popup className="fixed top-1/2 left-1/2 -mt-8 w-full max-w-[min(100vw-48px,320px)] -translate-1/2 rounded-lg border border-gray-300 bg-gray-50 p-6 outline-0">
        <Dialog.Title className="-mt-1.5 mb-1 text-lg font-medium">
          Your notifications
        </Dialog.Title>
        <Dialog.Description className="mb-4 text-gray-600">
          You are all caught up. Good job!
        </Dialog.Description>
        <Dialog.Close className="focus-visible:outline-blue ml-auto flex rounded-md bg-gray-50 px-3.5 py-2 font-medium text-gray-900 outline-1 outline-gray-200 select-none hover:bg-gray-100 focus-visible:outline-2">
          Close
        </Dialog.Close>
      </Dialog.Popup>
    </Dialog.Root>
  );
}
