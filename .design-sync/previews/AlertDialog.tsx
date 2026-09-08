import * as React from 'react';
import { AlertDialog } from '@base-ui/react';
import './AlertDialog.css';

export const Basic = () => (
  <AlertDialog.Root defaultOpen>
    <AlertDialog.Trigger data-color="red" className="Button">
      Discard draft
    </AlertDialog.Trigger>
    <AlertDialog.Portal>
      <AlertDialog.Backdrop className="Backdrop" />
      <AlertDialog.Popup className="Popup">
        <div className="Intro">
          <AlertDialog.Title className="Title">Discard draft?</AlertDialog.Title>
          <AlertDialog.Description className="Description">
            You can&apos;t undo this action.
          </AlertDialog.Description>
        </div>
        <div className="Actions">
          <AlertDialog.Close className="Button">Cancel</AlertDialog.Close>
          <AlertDialog.Close data-color="red" className="Button">
            Discard
          </AlertDialog.Close>
        </div>
      </AlertDialog.Popup>
    </AlertDialog.Portal>
  </AlertDialog.Root>
);

export const Confirm = () => (
  <AlertDialog.Root defaultOpen>
    <AlertDialog.Trigger className="Button">Log out</AlertDialog.Trigger>
    <AlertDialog.Portal>
      <AlertDialog.Backdrop className="Backdrop" />
      <AlertDialog.Popup className="Popup">
        <div className="Intro">
          <AlertDialog.Title className="Title">Log out of your account?</AlertDialog.Title>
          <AlertDialog.Description className="Description">
            You will need to sign in again to access your dashboard.
          </AlertDialog.Description>
        </div>
        <div className="Actions">
          <AlertDialog.Close className="Button">Stay signed in</AlertDialog.Close>
          <AlertDialog.Close className="Button">Log out</AlertDialog.Close>
        </div>
      </AlertDialog.Popup>
    </AlertDialog.Portal>
  </AlertDialog.Root>
);
