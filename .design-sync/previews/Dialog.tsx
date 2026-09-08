import * as React from 'react';
import { Dialog } from '@base-ui/react';
import './Dialog.css';

export const Basic = () => (
  <Dialog.Root defaultOpen modal={false}>
    <Dialog.Trigger className="Button">View notifications</Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Backdrop className="Backdrop" />
      <Dialog.Popup className="Popup">
        <div className="Intro">
          <Dialog.Title className="Title">Notifications</Dialog.Title>
          <Dialog.Description className="Description">
            You are all caught up. Good job!
          </Dialog.Description>
        </div>
        <div className="Actions">
          <Dialog.Close className="Button">Close</Dialog.Close>
        </div>
      </Dialog.Popup>
    </Dialog.Portal>
  </Dialog.Root>
);
