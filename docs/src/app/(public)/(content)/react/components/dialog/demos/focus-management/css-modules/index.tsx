'use client';
import * as React from 'react';
import { Dialog } from '@base-ui-components/react/dialog';
import { Fieldset } from '@base-ui-components/react/fieldset';
import { Field } from '@base-ui-components/react/field';
import styles from '../../_index.module.css';

export default function ExampleDialog() {
  const initialFocusRef = React.useRef<HTMLInputElement | null>(null);
  const finalFocusRef = React.useRef<HTMLButtonElement | null>(null);
  return (
    <div className={styles.Container}>
      <Dialog.Root>
        <Dialog.Trigger className={styles.Button}>Open dialog</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop className={styles.Backdrop} />
          <Dialog.Popup
            className={styles.Popup}
            initialFocus={initialFocusRef}
            finalFocus={finalFocusRef}
          >
            <Dialog.Title className={styles.Title}>Feedback form</Dialog.Title>
            <Dialog.Description render={<div />} className={styles.Description}>
              <Fieldset.Root className={styles.Fieldset}>
                <Field.Root className={styles.Field}>
                  <Field.Label className={styles.Label}>Full name (optional)</Field.Label>
                  <Field.Control placeholder="Enter your name" className={styles.Input} />
                </Field.Root>
                <Field.Root className={styles.Field}>
                  <Field.Label className={styles.Label}>Your feedback *</Field.Label>
                  <Field.Control
                    ref={initialFocusRef}
                    required
                    placeholder="Enter your feedback"
                    className={styles.Input}
                  />
                </Field.Root>
              </Fieldset.Root>
            </Dialog.Description>
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
