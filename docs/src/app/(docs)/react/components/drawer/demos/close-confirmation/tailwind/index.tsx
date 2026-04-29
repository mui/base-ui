'use client';
import * as React from 'react';
import { AlertDialog } from '@base-ui/react/alert-dialog';
import { Drawer } from '@base-ui/react/drawer';
import { Field } from '@base-ui/react/field';
import { Form } from '@base-ui/react/form';
import { useStableCallback } from '@base-ui/utils/useStableCallback';

type DrawerFormValues = {
  note: string;
};

export default function ExampleDrawer() {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [confirmationOpen, setConfirmationOpen] = React.useState(false);
  const [draftNote, setDraftNote] = React.useState('');
  const [savedNote, setSavedNote] = React.useState('');

  const hasUnsavedChanges = draftNote !== savedNote;

  const handleSubmit = useStableCallback((formValues: DrawerFormValues) => {
    setSavedNote(formValues.note);
    setDraftNote(formValues.note);
    setDrawerOpen(false);
  });

  const handleOpenChange = useStableCallback(
    (nextOpen: boolean, eventDetails: Drawer.Root.ChangeEventDetails) => {
      if (nextOpen) {
        setDrawerOpen(true);
        return;
      }

      if (hasUnsavedChanges) {
        eventDetails.cancel();
        setConfirmationOpen(true);
        return;
      }

      setDrawerOpen(false);
    },
  );

  const discardChanges = useStableCallback(() => {
    setDraftNote(savedNote);
    setConfirmationOpen(false);
    setDrawerOpen(false);
  });

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <Drawer.Root swipeDirection="right" open={drawerOpen} onOpenChange={handleOpenChange}>
        <section
          className="box-border flex min-h-[12.5rem] w-[min(100%,28rem)] flex-col gap-1.5 rounded-xl border border-gray-200 bg-gray-50 p-5 text-gray-900"
          aria-labelledby="drawer-form-summary"
        >
          <div className="flex min-w-0 flex-col gap-1.5">
            <p id="drawer-form-summary" className="m-0 text-sm font-bold leading-5">
              Saved note
            </p>
            <p
              className="m-0 overflow-hidden text-base leading-6 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]"
              title={savedNote || 'No note saved yet.'}
            >
              {savedNote || 'No note saved yet.'}
            </p>
          </div>
          <Drawer.Trigger className="mt-auto w-fit flex h-10 self-start items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-normal text-gray-900 select-none hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100">
            Open note drawer
          </Drawer.Trigger>
        </section>
        <Drawer.Portal>
          <Drawer.Backdrop className="[--backdrop-opacity:0.2] dark:[--backdrop-opacity:0.7] fixed inset-0 min-h-dvh bg-black opacity-[calc(var(--backdrop-opacity)*(1-var(--drawer-swipe-progress)))] transition-opacity duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-[swiping]:duration-0 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 data-[ending-style]:duration-[calc(var(--drawer-swipe-strength)*400ms)] supports-[-webkit-touch-callout:none]:absolute" />
          <Drawer.Viewport className="[--viewport-padding:0px] supports-[-webkit-touch-callout:none]:[--viewport-padding:0.625rem] fixed inset-0 flex items-stretch justify-end p-[var(--viewport-padding)]">
            <Drawer.Popup className="[--bleed:3rem] supports-[-webkit-touch-callout:none]:[--bleed:0px] h-full w-[calc(20rem+3rem)] max-w-[calc(100vw-3rem+3rem)] -mr-[3rem] bg-gray-50 p-6 pr-[calc(1.5rem+3rem)] text-gray-900 outline outline-1 outline-gray-200 overflow-y-auto overscroll-contain touch-auto will-change-transform [transform:translateX(var(--drawer-swipe-movement-x))] transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-[swiping]:select-none data-[starting-style]:[transform:translateX(calc(100%-var(--bleed)+var(--viewport-padding)+2px))] data-[ending-style]:[transform:translateX(calc(100%-var(--bleed)+var(--viewport-padding)+2px))] data-[ending-style]:duration-[calc(var(--drawer-swipe-strength)*400ms)] supports-[-webkit-touch-callout:none]:mr-0 supports-[-webkit-touch-callout:none]:w-[20rem] supports-[-webkit-touch-callout:none]:max-w-[calc(100vw-20px)] supports-[-webkit-touch-callout:none]:rounded-[10px] supports-[-webkit-touch-callout:none]:pr-6 dark:outline-gray-300">
              <Drawer.Content className="mx-auto flex flex-1 flex-col gap-5 w-full max-w-[32rem]">
                <div className="flex flex-col gap-1.5">
                  <Drawer.Title className="-mt-1.5 text-lg font-bold leading-7 tracking-[-0.0025em]">
                    Edit note
                  </Drawer.Title>
                  <Drawer.Description className="m-0 text-base leading-6 text-gray-600">
                    Save your note, or discard it if you change your mind.
                  </Drawer.Description>
                </div>

                <Form className="flex flex-1 flex-col gap-5" onFormSubmit={handleSubmit}>
                  <Field.Root name="note" className="flex flex-1 flex-col gap-1">
                    <Field.Label className="text-sm leading-5 font-bold text-gray-900">
                      Note
                    </Field.Label>
                    <Field.Control
                      render={<textarea rows={8} />}
                      value={draftNote}
                      onValueChange={setDraftNote}
                      placeholder="Write a short note..."
                      autoFocus
                      className="box-border m-0 w-full min-h-48 rounded-md border border-gray-200 bg-transparent p-3.5 font-inherit text-base font-normal text-gray-900 resize-y focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800"
                    />
                  </Field.Root>

                  <div className="flex justify-end gap-3">
                    <Drawer.Close
                      type="button"
                      className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-normal text-gray-900 select-none hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100"
                    >
                      Cancel
                    </Drawer.Close>
                    <button
                      type="submit"
                      className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-normal text-gray-900 select-none hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100"
                    >
                      Save note
                    </button>
                  </div>
                </Form>
              </Drawer.Content>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Confirmation dialog */}
      <AlertDialog.Root open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className="fixed inset-0 min-h-dvh z-50 bg-black opacity-20 transition-opacity duration-150 dark:opacity-70 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 supports-[-webkit-touch-callout:none]:absolute" />
          <AlertDialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <AlertDialog.Popup className="relative z-50 box-border w-[min(calc(100vw-2rem),26rem)] rounded-lg bg-gray-50 p-5 text-gray-900 outline outline-1 outline-gray-200 transition-all duration-150 data-[starting-style]:opacity-0 data-[starting-style]:[transform:scale(0.96)] data-[ending-style]:opacity-0 data-[ending-style]:[transform:scale(0.96)]">
              <div className="flex flex-col gap-3.5">
                <AlertDialog.Title className="-mt-1.5 text-lg font-bold leading-7 tracking-[-0.0025em]">
                  Discard changes?
                </AlertDialog.Title>
                <AlertDialog.Description className="m-0 text-base leading-6 text-gray-600">
                  You have unsaved changes. If you leave now, they will be lost.
                </AlertDialog.Description>
                <div className="flex justify-end gap-3">
                  <AlertDialog.Close
                    type="button"
                    className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-normal text-gray-900 select-none hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100"
                  >
                    Keep editing
                  </AlertDialog.Close>
                  <button
                    type="button"
                    className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-normal text-gray-900 select-none hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100"
                    onClick={discardChanges}
                  >
                    Discard changes
                  </button>
                </div>
              </div>
            </AlertDialog.Popup>
          </AlertDialog.Viewport>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
