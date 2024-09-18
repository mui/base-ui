'use client';
import * as React from 'react';
import * as Dialog from '@base_ui/react/Dialog';

export default function UnstyledDialogIntroduction() {
  return (
    <Dialog.Root>
      <TriggerButton>Subscribe</TriggerButton>
      <Backdrop />
      <Popup>
        <Title>Subscribe</Title>
        <Description>
          Enter your email address to subscribe to our newsletter.
        </Description>
        <TextField
          type="email"
          aria-label="Email address"
          placeholder="name@example.com"
        />
        <Controls>
          <CloseButton>Subscribe</CloseButton>
          <CloseButton>Cancel</CloseButton>
        </Controls>
      </Popup>
    </Dialog.Root>
  );
}

function TriggerButton(props: Dialog.TriggerProps) {
  const className = `
    bg-slate-900 dark:bg-slate-50 text-slate-50 dark:text-slate-900
    py-2 px-4 rounded min-w-[80px] border-none font-sans
    hover:bg-slate-700 dark:hover:bg-slate-200`;

  return <Dialog.Trigger {...props} className={className} />;
}

function Popup(props: Dialog.PopupProps) {
  const className = `
    bg-slate-50 dark:bg-slate-900 border-[1px] border-solid border-slate-100 dark:border-slate-700
    min-w-[400px] rounded shadow-xl fixed top-2/4 left-2/4 z-[2100]
    -translate-x-2/4 -translate-y-2/4 p-4`;

  return <Dialog.Popup {...props} className={className} />;
}

function Controls(props: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      {...props}
      className="flex flex-row-reverse bg-slate-100 dark:bg-slate-800 gap-2 p-4 mt-8 -mx-4 -mb-4"
    />
  );
}

function CloseButton(props: Dialog.CloseProps) {
  const className = `
    bg-transparent border-[1px] border-solid border-slate-500 dark:border-slate-300
    text-slate-900 dark:text-slate-50 py-2 px-4 rounded font-sans min-w-[80px]
    hover:bg-slate-200 dark:hover:bg-slate-700`;

  return <Dialog.Close {...props} className={className} />;
}

function Title(props: Dialog.TitleProps) {
  return <Dialog.Title {...props} className="text-lg" />;
}

function Description(props: Dialog.DescriptionProps) {
  return <Dialog.Description {...props} />;
}

function Backdrop(props: Dialog.BackdropProps) {
  return (
    <Dialog.Backdrop
      {...props}
      className="bg-black/35 fixed inset-0 backdrop-blur-sm z-[2000]"
    />
  );
}

function TextField(props: React.ComponentPropsWithoutRef<'input'>) {
  const className = `
    w-full p-2 mt-4 font-sans
    border-[1px] border-solid border-slate-300 dark:border-slate-700 rounded
  `;
  return <input {...props} className={className} />;
}
