'use client';
import * as React from 'react';
import { Dialog } from '@base-ui-components/react/dialog';
import classes from './styles.module.css';

export default function UnstyledDialogIntroduction() {
  return (
    <Dialog.Root>
      <Dialog.Trigger className={classes.trigger}>Subscribe</Dialog.Trigger>
      <Dialog.Backdrop className={classes.backdrop} />
      <Dialog.Popup className={classes.popup}>
        <Dialog.Title className={classes.title}>Subscribe</Dialog.Title>
        <Dialog.Description>
          Enter your email address to subscribe to our newsletter.
        </Dialog.Description>
        <input
          className={classes.textfield}
          type="email"
          aria-label="Email address"
          placeholder="name@example.com"
        />
        <div className="controls">
          <Dialog.Close className={classes.close}>Subscribe</Dialog.Close>
          <Dialog.Close className={classes.close}>Cancel</Dialog.Close>
        </div>
      </Dialog.Popup>
    </Dialog.Root>
  );
}
