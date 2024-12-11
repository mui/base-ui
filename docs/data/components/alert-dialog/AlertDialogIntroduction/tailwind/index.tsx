'use client';
import * as React from 'react';
import { AlertDialog } from '@base-ui-components/react/alert-dialog';

export default function UnstyledDialogIntroduction() {
  return (
    <AlertDialog.Root>
      <TriggerButton>Subscribe</TriggerButton>
      <Backdrop />
      <AlertDialog.Portal>
        <Popup>
          <Title>Subscribe</Title>
          <Description>Are you sure you want to subscribe?</Description>
          <Controls>
            <CloseButton>Yes</CloseButton>
            <CloseButton>No</CloseButton>
          </Controls>
        </Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

function TriggerButton(props: AlertDialog.Trigger.Props) {
  const className = `
    bg-gray-900 dark:bg-gray-50 text-gray-50 dark:text-gray-900
    py-2 px-4 rounded min-w-[80px] border-none font-sans
    hover:bg-gray-700 dark:hover:bg-gray-200`;

  return <AlertDialog.Trigger {...props} className={className} />;
}

function Popup(props: AlertDialog.Popup.Props) {
  const className = `
    bg-gray-50 dark:bg-gray-900 border-[1px] border-solid border-gray-100 dark:border-gray-700
    min-w-[400px] rounded shadow-xl fixed top-2/4 left-2/4 z-[2100]
    -translate-x-2/4 -translate-y-2/4 p-4`;

  return <AlertDialog.Popup {...props} className={className} />;
}

function Controls(props: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      {...props}
      className="-mx-4 mt-8 -mb-4 flex flex-row-reverse gap-2 bg-gray-100 p-4 dark:bg-gray-800"
    />
  );
}

function CloseButton(props: AlertDialog.Close.Props) {
  const className = `
    bg-transparent border-[1px] border-solid border-gray-500 dark:border-gray-300
    text-gray-900 dark:text-gray-50 py-2 px-4 rounded font-sans min-w-[80px]
    hover:bg-gray-200 dark:hover:bg-gray-700`;

  return <AlertDialog.Close {...props} className={className} />;
}

function Title(props: AlertDialog.Title.Props) {
  return <AlertDialog.Title {...props} className="text-lg" />;
}

function Description(props: AlertDialog.Description.Props) {
  return <AlertDialog.Description {...props} />;
}

function Backdrop(props: AlertDialog.Backdrop.Props) {
  return (
    <AlertDialog.Backdrop
      {...props}
      className="fixed inset-0 z-[2000] bg-black/35 backdrop-blur-sm"
    />
  );
}
