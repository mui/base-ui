'use client';
import * as React from 'react';
import { Dialog } from '@base-ui-components/react/dialog';

export default function UnstyledDialogIntroduction() {
  return (
    <Dialog.Root>
      <TriggerButton>Subscribe</TriggerButton>
      <Backdrop />
      <Dialog.Portal>
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
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function TriggerButton(props) {
  const className = `
    bg-gray-900 dark:bg-gray-50 text-gray-50 dark:text-gray-900
    py-2 px-4 rounded min-w-[80px] border-none font-sans
    hover:bg-gray-700 dark:hover:bg-gray-200`;

  return <Dialog.Trigger {...props} className={className} />;
}

function Popup(props) {
  const className = `
    bg-gray-50 dark:bg-gray-900 border-[1px] border-solid border-gray-100 dark:border-gray-700
    min-w-[400px] rounded shadow-xl fixed top-2/4 left-2/4 z-[2100]
    -translate-x-2/4 -translate-y-2/4 p-4`;

  return <Dialog.Popup {...props} className={className} />;
}

function Controls(props) {
  return (
    <div
      {...props}
      className="-mx-4 mt-8 -mb-4 flex flex-row-reverse gap-2 bg-gray-100 p-4 dark:bg-gray-800"
    />
  );
}

function CloseButton(props) {
  const className = `
    bg-transparent border-[1px] border-solid border-gray-500 dark:border-gray-300
    text-gray-900 dark:text-gray-50 py-2 px-4 rounded font-sans min-w-[80px]
    hover:bg-gray-200 dark:hover:bg-gray-700`;

  return <Dialog.Close {...props} className={className} />;
}

function Title(props) {
  return <Dialog.Title {...props} className="text-lg" />;
}

function Description(props) {
  return <Dialog.Description {...props} />;
}

function Backdrop(props) {
  return (
    <Dialog.Backdrop
      {...props}
      className="fixed inset-0 z-[2000] bg-black/35 backdrop-blur-sm"
    />
  );
}

function TextField(props) {
  const className = `
    w-full p-2 mt-4 font-sans
    border-[1px] border-solid border-gray-300 dark:border-gray-700 rounded
  `;
  return <input {...props} className={className} />;
}
