'use client';
import * as React from 'react';
import * as AlertDialog from '@base_ui/react/AlertDialog';

export default function UnstyledDialogIntroduction() {
  return (
    <AlertDialog.Root>
      <TriggerButton>Subscribe</TriggerButton>
      <Backdrop />
      <Popup>
        <Title>Subscribe</Title>
        <Description>Are you sure you want to subscribe?</Description>
        <Controls>
          <CloseButton>Yes</CloseButton>
          <CloseButton>No</CloseButton>
        </Controls>
      </Popup>
    </AlertDialog.Root>
  );
}

function TriggerButton(props: AlertDialog.Trigger.Props) {
  const className = `
    bg-slate-900 dark:bg-slate-50 text-slate-50 dark:text-slate-900
    py-2 px-4 rounded min-w-[80px] border-none font-sans
    hover:bg-slate-700 dark:hover:bg-slate-200`;

  return <AlertDialog.Trigger {...props} className={className} />;
}

function Popup(props: AlertDialog.Popup.Props) {
  const className = `
    bg-slate-50 dark:bg-slate-900 border-[1px] border-solid border-slate-100 dark:border-slate-700
    min-w-[400px] rounded shadow-xl fixed top-2/4 left-2/4 z-[2100]
    -translate-x-2/4 -translate-y-2/4 p-4`;

  return <AlertDialog.Popup {...props} className={className} />;
}

function Controls(props: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      {...props}
      className="flex flex-row-reverse bg-slate-100 dark:bg-slate-800 gap-2 p-4 mt-8 -mx-4 -mb-4"
    />
  );
}

function CloseButton(props: AlertDialog.Close.Props) {
  const className = `
    bg-transparent border-[1px] border-solid border-slate-500 dark:border-slate-300
    text-slate-900 dark:text-slate-50 py-2 px-4 rounded font-sans min-w-[80px]
    hover:bg-slate-200 dark:hover:bg-slate-700`;

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
      className="bg-black/35 fixed inset-0 backdrop-blur-sm z-[2000]"
    />
  );
}
