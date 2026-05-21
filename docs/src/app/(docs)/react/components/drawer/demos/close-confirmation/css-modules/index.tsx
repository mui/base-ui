'use client';
import * as React from 'react';
import { AlertDialog } from '@base-ui/react/alert-dialog';
import { Drawer } from '@base-ui/react/drawer';
import { Field } from '@base-ui/react/field';
import { Form } from '@base-ui/react/form';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import styles from './index.module.css';

type DrawerFormValues = {
  note: string;
};

export default function ExampleDrawer() {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [confirmationOpen, setConfirmationOpen] = React.useState(false);
  const [draftNote, setDraftNote] = React.useState('');
  const [savedNote, setSavedNote] = React.useState('');

  const hasUnsavedChanges = draftNote !== savedNote;

  const handleSubmit = useStableCallback((formValues: DrawerFormValues) => {
    setSavedNote(formValues.note);
    setDraftNote(formValues.note);
    setDrawerOpen(false);
  });

  const handleOpenChange = useStableCallback(
    (nextOpen: boolean, eventDetails: Drawer.Root.ChangeEventDetails) => {
      if (nextOpen) {
        setDrawerOpen(true);
        return;
      }

      if (hasUnsavedChanges) {
        eventDetails.cancel();
        setConfirmationOpen(true);
        return;
      }

      setDrawerOpen(false);
    },
  );

  const discardChanges = useStableCallback(() => {
    setDraftNote(savedNote);
    setConfirmationOpen(false);
    setDrawerOpen(false);
  });

  return (
    <div className={styles.Demo}>
      <Drawer.Root swipeDirection="right" open={drawerOpen} onOpenChange={handleOpenChange}>
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
                  <Field.Root name="note" className={styles.Field}>
                    <Field.Label className={styles.Label}>Note</Field.Label>
                    <Field.Control
                      render={<textarea rows={8} />}
                      value={draftNote}
                      onValueChange={setDraftNote}
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

      {/* Confirmation dialog */}
      <AlertDialog.Root open={confirmationOpen} onOpenChange={setConfirmationOpen}>
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
