'use client';
import * as React from 'react';
import { Dialog } from '@base-ui-components/react/dialog';
import { Fieldset } from '@base-ui-components/react/fieldset';
import { Field } from '@base-ui-components/react/field';

export default function ExampleDialog() {
  const initialFocusRef = React.useRef<HTMLInputElement | null>(null);
  const finalFocusRef = React.useRef<HTMLButtonElement | null>(null);
  return (
    <div className="flex gap-2">
      <Dialog.Root>
        <Dialog.Trigger className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium text-gray-900 select-none hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100">
          Open dialog
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 min-h-dvh bg-black opacity-20 transition-all duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 dark:opacity-70 supports-[-webkit-touch-callout:none]:absolute" />
          <Dialog.Popup
            initialFocus={initialFocusRef}
            finalFocus={finalFocusRef}
            className="fixed top-1/2 left-1/2 -mt-8 w-96 max-w-[calc(100vw-3rem)] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-gray-50 p-6 text-gray-900 outline outline-1 outline-gray-200 transition-all duration-150 data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0 dark:outline-gray-300"
          >
            <Dialog.Title className="-mt-1.5 mb-1 text-lg font-medium">Feedback form</Dialog.Title>
            <Dialog.Description render={<div />} className="mt-6 mb-6 text-base text-gray-600">
              <p>
                You feedback means a lot to us! See how we process this data <a href="#" className='underline'>here</a>.
              </p>
              <Fieldset.Root className="flex w-full max-w-64 flex-col gap-4 mt-[1rem]">
                <Field.Root className="flex flex-col items-start gap-1">
                  <Field.Label className="text-sm font-medium text-gray-900">
                    Full name (optional)
                  </Field.Label>
                  <Field.Control
                    ref={initialFocusRef}
                    placeholder="Enter your name"
                    className="h-10 w-full rounded-md border border-gray-200 pl-3.5 text-base text-gray-900 focus:outline focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800"
                  />
                </Field.Root>
                <Field.Root className="flex flex-col items-start gap-1">
                  <Field.Label className="text-sm font-medium text-gray-900">
                    Your feedback *
                  </Field.Label>
                  <Field.Control
                    required
                    placeholder="Enter your feedback"
                    className="h-10 w-full rounded-md border border-gray-200 pl-3.5 text-base text-gray-900 focus:outline focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800"
                  />
                </Field.Root>
              </Fieldset.Root>
            </Dialog.Description>
            <div className="flex justify-end gap-4">
              <Dialog.Close className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium text-gray-900 select-none hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100">
                Close
              </Dialog.Close>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
      <button
        ref={finalFocusRef}
        type="button"
        className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium text-gray-900 select-none hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100"
      >
        Final focus
      </button>
    </div>
  );
}
