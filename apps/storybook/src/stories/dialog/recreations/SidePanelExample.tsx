import * as React from 'react';
import { Dialog } from '@base-ui/react/dialog';
import styles from '../dialog.module.css';

/**
 * Recreation of an edge-docked side panel: a fully controlled Dialog with no Trigger
 * (routes/app state open it), positioned against the viewport edge with a slide
 * transition and a form + footer actions. Recomposed from oxidecomputer/console
 * `SideModal.tsx`/`Modal.tsx` (MPL-2.0, code-ok,
 * research/d-real-world-usage/dialog/ranked.json #4).
 */
export function SidePanelExample() {
  const [open, setOpen] = React.useState(false);
  const [saved, setSaved] = React.useState<string | null>(null);
  const nameId = React.useId();
  return (
    <div className={styles.Stack}>
      {/* No Dialog.Trigger: app state opens the panel, oxide-console style. */}
      <button type="button" className={styles.Button} onClick={() => setOpen(true)}>
        Edit instance
      </button>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className={styles.Backdrop} />
          <Dialog.Popup className={styles.SheetPopup}>
            <div className={styles.Intro}>
              <Dialog.Title className={styles.Title}>Edit instance</Dialog.Title>
              <Dialog.Description className={styles.Description}>
                db-primary · us-east-1
              </Dialog.Description>
            </div>
            <form
              className={styles.SheetForm}
              onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                setSaved(String(data.get('name')));
                setOpen(false);
              }}
            >
              <div className={styles.Field}>
                <label className={styles.Label} htmlFor={nameId}>
                  Instance name
                </label>
                <input id={nameId} name="name" defaultValue="db-primary" className={styles.Input} />
              </div>
              <div className={styles.SheetFooter}>
                <Dialog.Close className={styles.GhostButton}>Cancel</Dialog.Close>
                <button type="submit" className={styles.Button}>
                  Save changes
                </button>
              </div>
            </form>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
      {saved !== null ? <output className={styles.Output}>Saved: {saved}</output> : null}
    </div>
  );
}
