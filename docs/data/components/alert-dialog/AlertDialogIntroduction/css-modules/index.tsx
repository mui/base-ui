'use client';
import * as React from 'react';
import { AlertDialog } from '@base-ui-components/react/alert-dialog';
import classes from './styles.module.css';

export default function AlertDialogIntroduction() {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger className={classes.trigger}>
        Subscribe
      </AlertDialog.Trigger>
      <AlertDialog.Backdrop className={classes.backdrop} />
      <AlertDialog.Popup className={classes.popup}>
        <AlertDialog.Title className={classes.title}>Subscribe</AlertDialog.Title>
        <AlertDialog.Description>
          Are you sure you want to subscribe?
        </AlertDialog.Description>
        <div className={classes.controls}>
          <AlertDialog.Close className={classes.close}>Yes</AlertDialog.Close>
          <AlertDialog.Close className={classes.close}>No</AlertDialog.Close>
        </div>
      </AlertDialog.Popup>
    </AlertDialog.Root>
  );
}
