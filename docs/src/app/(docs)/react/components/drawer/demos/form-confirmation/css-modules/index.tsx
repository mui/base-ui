'use client';
import * as React from 'react';
import { AlertDialog } from '@base-ui/react/alert-dialog';
import { Drawer } from '@base-ui/react/drawer';
import { Field } from '@base-ui/react/field';
import { Form } from '@base-ui/react/form';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import styles from './index.module.css';

type DrawerFormValues = {
  notes: string;
};

export default function ExampleDrawer() {
  const [open, setOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [note, setNote] = React.useState('');
  const [savedNote, setSavedNote] = React.useState('');

  const isDirty = note !== savedNote;

  const handleSubmit = useStableCallback((formValues: DrawerFormValues) => {
    setSavedNote(formValues.notes);
    setNote(formValues.notes);
    setOpen(false);
  });

  const handleOpenChange = useStableCallback(
    (nextOpen: boolean, eventDetails: Drawer.Root.ChangeEventDetails) => {
      if (nextOpen) {
        setOpen(true);
        return;
      }

      if (isDirty) {
        eventDetails.cancel();
        setConfirmOpen(true);
        return;
      }

      setOpen(false);
    },
  );

  const discardChanges = useStableCallback(() => {
    setNote(savedNote);
    setConfirmOpen(false);
    setOpen(false);
  });

  return (
    <div className={styles.Demo}>
      <Drawer.Root swipeDirection="right" open={open} onOpenChange={handleOpenChange}>
        <section className={styles.Summary} aria-labelledby="drawer-form-summary">
          <div className={styles.SummaryContent}>
            <p id="drawer-form-summary" className={styles.SummaryLabel}>
              Saved note
            </p>
            <p className={styles.SummaryValue} title={savedNote || 'No note saved yet.'}>
              {savedNote || 'No note saved yet.'}
            </p>
          </div>
          <Drawer.Trigger className={styles.Button}>Open note drawer</Drawer.Trigger>
        </section>
        <Drawer.Portal>
          <Drawer.Backdrop className={styles.Backdrop} />
          <Drawer.Viewport className={styles.Viewport}>
            <Drawer.Popup className={styles.Popup}>
              <Drawer.Content className={styles.Content}>
                <div className={styles.Header}>
                  <Drawer.Title className={styles.Title}>Edit note</Drawer.Title>
                  <Drawer.Description className={styles.Description}>
                    Save your note, or discard it if you change your mind.
                  </Drawer.Description>
                </div>

                <Form className={styles.Form} onFormSubmit={handleSubmit}>
                  <Field.Root name="notes" className={styles.Field}>
                    <Field.Label className={styles.Label}>Note</Field.Label>
                    <Field.Control
                      render={<textarea rows={8} />}
                      value={note}
                      onValueChange={setNote}
                      placeholder="Write a short note..."
                      autoFocus
                      className={styles.Textarea}
                    />
                  </Field.Root>

                  <div className={styles.Actions}>
                    <Drawer.Close type="button" className={styles.Button}>
                      Cancel
                    </Drawer.Close>
                    <button type="submit" className={styles.Button}>
                      Save note
                    </button>
                  </div>
                </Form>
              </Drawer.Content>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>

      <AlertDialog.Root open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className={styles.AlertBackdrop} />
          <AlertDialog.Viewport className={styles.AlertViewport}>
            <AlertDialog.Popup className={styles.AlertPopup}>
              <div className={styles.AlertContent}>
                <AlertDialog.Title className={styles.AlertTitle}>
                  Discard changes?
                </AlertDialog.Title>
                <AlertDialog.Description className={styles.AlertDescription}>
                  You have unsaved changes. If you leave now, they will be lost.
                </AlertDialog.Description>
                <div className={styles.AlertActions}>
                  <AlertDialog.Close type="button" className={styles.Button}>
                    Keep editing
                  </AlertDialog.Close>
                  <button type="button" className={styles.Button} onClick={discardChanges}>
                    Discard changes
                  </button>
                </div>
              </div>
            </AlertDialog.Popup>
          </AlertDialog.Viewport>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
