'use client';
import * as React from 'react';
import { Dialog } from '@base-ui/react/dialog';
import styles from './index.module.css';

export default function ExampleDialog() {
  const initialFocusRef = React.useRef<HTMLInputElement | null>(null);
  const finalFocusRef = React.useRef<HTMLButtonElement | null>(null);
  const nameId = React.useId();
  const feedbackId = React.useId();

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
            <div className={styles.Fields}>
              <div className={styles.Field}>
                <label htmlFor={nameId} className={styles.Label}>
                  Full name
                </label>
                <input id={nameId} placeholder="Enter your name" className={styles.Input} />
              </div>
              <div className={styles.Field}>
                <label htmlFor={feedbackId} className={styles.Label}>
                  Feedback
                </label>
                <input
                  id={feedbackId}
                  ref={initialFocusRef}
                  required
                  placeholder="Enter your feedback"
                  className={styles.Input}
                />
              </div>
            </div>
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
