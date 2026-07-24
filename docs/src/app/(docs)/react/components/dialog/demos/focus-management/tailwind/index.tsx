'use client';
import * as React from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { Field } from '@base-ui/react/field';
import { Fieldset } from '@base-ui/react/fieldset';

export default function ExampleDialog() {
  const initialFocusRef = React.useRef<HTMLInputElement | null>(null);
  const finalFocusRef = React.useRef<HTMLButtonElement | null>(null);

  return (
    <div className="flex flex-wrap justify-center gap-3">
      <Dialog.Root>
        <Dialog.Trigger className="flex h-8 items-center justify-center gap-2 border border-neutral-950 dark:border-white bg-white dark:bg-neutral-950 px-3 text-sm leading-none whitespace-nowrap font-normal text-neutral-950 dark:text-white select-none hover:not-data-disabled:bg-neutral-100 dark:hover:not-data-disabled:bg-neutral-800 active:not-data-disabled:bg-neutral-200 dark:active:not-data-disabled:bg-neutral-700 data-disabled:border-neutral-500 data-disabled:text-neutral-500 disabled:border-neutral-500 disabled:text-neutral-500 dark:data-disabled:border-neutral-400 dark:data-disabled:text-neutral-400 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:focus-visible:outline-white">
          Open feedback
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 min-h-dvh bg-black opacity-20 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 dark:opacity-50 supports-[-webkit-touch-callout:none]:absolute" />
          <Dialog.Popup
            initialFocus={initialFocusRef}
            finalFocus={finalFocusRef}
            className="fixed top-1/2 left-1/2 -mt-8 flex w-96 max-w-[calc(100vw-3rem)] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 bg-white dark:bg-neutral-950 p-4 text-neutral-950 dark:text-white border border-neutral-950 dark:border-white shadow-[0.25rem_0.25rem_0] shadow-black/12 dark:shadow-none transition-[scale,opacity] duration-100 ease-out data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0"
          >
            <div className="flex flex-col gap-1">
              <Dialog.Title className="text-base font-bold">Feedback form</Dialog.Title>
              <Dialog.Description className="text-sm text-neutral-600 dark:text-neutral-400">
                Your feedback means a lot to us.
              </Dialog.Description>
            </div>
            <Fieldset.Root className="flex flex-col gap-3 border-0 p-0 m-0">
              <Field.Root className="flex flex-col items-start gap-1">
                <Field.Label className="text-sm font-normal">Full name</Field.Label>
                <Field.Control
                  ref={initialFocusRef}
                  placeholder="Enter your name"
                  className="h-8 w-full border border-neutral-950 dark:border-white bg-white dark:bg-neutral-950 px-2 text-sm any-pointer-coarse:text-base font-normal text-neutral-950 dark:text-white placeholder:text-neutral-500 dark:placeholder:text-neutral-400 focus:outline-2 focus:-outline-offset-1 focus:outline-neutral-950 dark:focus:outline-white"
                />
              </Field.Root>
              <Field.Root className="flex flex-col items-start gap-1">
                <Field.Label className="text-sm font-normal">Feedback</Field.Label>
                <Field.Control
                  required
                  placeholder="Enter your feedback"
                  className="h-8 w-full border border-neutral-950 dark:border-white bg-white dark:bg-neutral-950 px-2 text-sm any-pointer-coarse:text-base font-normal text-neutral-950 dark:text-white placeholder:text-neutral-500 dark:placeholder:text-neutral-400 focus:outline-2 focus:-outline-offset-1 focus:outline-neutral-950 dark:focus:outline-white"
                />
              </Field.Root>
            </Fieldset.Root>
            <div className="flex justify-end gap-3">
              <Dialog.Close className="flex h-8 items-center justify-center gap-2 border border-neutral-950 dark:border-white bg-white dark:bg-neutral-950 px-3 text-sm leading-none whitespace-nowrap font-normal text-neutral-950 dark:text-white select-none hover:not-data-disabled:bg-neutral-100 dark:hover:not-data-disabled:bg-neutral-800 active:not-data-disabled:bg-neutral-200 dark:active:not-data-disabled:bg-neutral-700 data-disabled:border-neutral-500 data-disabled:text-neutral-500 disabled:border-neutral-500 disabled:text-neutral-500 dark:data-disabled:border-neutral-400 dark:data-disabled:text-neutral-400 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:focus-visible:outline-white">
                Close
              </Dialog.Close>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
      <button
        ref={finalFocusRef}
        type="button"
        className="flex h-8 items-center justify-center gap-2 border border-neutral-950 dark:border-white bg-white dark:bg-neutral-950 px-3 text-sm leading-none whitespace-nowrap font-normal text-neutral-950 dark:text-white select-none hover:bg-neutral-100 dark:hover:bg-neutral-800 active:bg-neutral-200 dark:active:bg-neutral-700 disabled:border-neutral-500 disabled:text-neutral-500 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:focus-visible:outline-white"
      >
        Final focus
      </button>
    </div>
  );
}
