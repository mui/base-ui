'use client';
import * as React from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { Field } from '@base-ui/react/field';
import { Fieldset } from '@base-ui/react/fieldset';
import styles from './index.module.css';

export default function ExampleDialog() {
  const initialFocusRef = React.useRef<HTMLInputElement | null>(null);
  const finalFocusRef = React.useRef<HTMLButtonElement | null>(null);

  return (
    <div className={styles.Container}>
      <Dialog.Root>
        <Dialog.Trigger className={styles.Button}>Open feedback</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop className={styles.Backdrop} />
          <Dialog.Popup
            className={styles.Popup}
            initialFocus={initialFocusRef}
            finalFocus={finalFocusRef}
          >
            <div className={styles.Intro}>
              <Dialog.Title className={styles.Title}>Feedback form</Dialog.Title>
              <Dialog.Description className={styles.Description}>
                Your feedback means a lot to us.
              </Dialog.Description>
            </div>
            <Fieldset.Root className={styles.Fieldset}>
              <Field.Root className={styles.Field}>
                <Field.Label className={styles.Label}>Full name</Field.Label>
                <Field.Control
                  ref={initialFocusRef}
                  placeholder="Enter your name"
                  className={styles.Input}
                />
              </Field.Root>
              <Field.Root className={styles.Field}>
                <Field.Label className={styles.Label}>Feedback</Field.Label>
                <Field.Control
                  required
                  placeholder="Enter your feedback"
                  className={styles.Input}
                />
              </Field.Root>
            </Fieldset.Root>
            <div className={styles.Actions}>
              <Dialog.Close className={styles.Button}>Close</Dialog.Close>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
      <button ref={finalFocusRef} type="button" className={styles.Button}>
        Final focus
      </button>
    </div>
  );
}
