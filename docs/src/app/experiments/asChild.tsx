'use client';

import * as React from 'react';
import { Dialog } from '@base_ui/react/Dialog';
import classes from './asChild.module.css';

export default function AsChildExperiment() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        {(props, state) => (
          <MyButton {...props}>
            My DS Trigger button {state.open ? '(open)' : '(closed)'}
          </MyButton>
        )}
      </Dialog.Trigger>
      <Dialog.Backdrop className={classes.backdrop} />
      <Dialog.Popup className={classes.popup}>
        <Dialog.Title asChild>
          <h1 className={classes.title}>Subscribe</h1>
        </Dialog.Title>
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
          <Dialog.Close className={classes.close} asChild>
            <MyButton>Subscribe</MyButton>
          </Dialog.Close>
          <Dialog.Close className={classes.close}>Cancel</Dialog.Close>
        </div>
      </Dialog.Popup>
    </Dialog.Root>
  );
}

function MyButton(props: React.ComponentProps<'button'>) {
  return <button type="button" {...props} className={classes.trigger} />;
}
