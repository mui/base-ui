import * as React from 'react';
import { Dialog } from '@base-ui/react/dialog';
import styles from '../dialog.module.css';
import { XIcon } from '../icons';

/**
 * Recreation of the canonical copy-paste wrapper: a `DialogContent`-style component
 * (Popup→Content, Backdrop→Overlay vocabulary) used here as a settings dialog with
 * sections. Recomposed from shadcn-ui/ui `apps/v4/registry/bases/base/ui/dialog.tsx`
 * (MIT, code-ok, research/d-real-world-usage/dialog/ranked.json #1).
 */

/**
 * Wrapper layer in the shadcn/ui style: one component hides the
 * `Portal > Backdrop > Popup` plumbing and always renders a corner X close button.
 */
function AppDialogContent({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <Dialog.Portal>
      <Dialog.Backdrop className={styles.Backdrop} />
      <Dialog.Popup className={styles.Popup}>
        <div className={styles.Intro}>
          <Dialog.Title className={styles.Title}>{title}</Dialog.Title>
          {description ? (
            <Dialog.Description className={styles.Description}>{description}</Dialog.Description>
          ) : null}
        </div>
        {children}
        <Dialog.Close className={styles.CornerClose} aria-label="Close">
          <XIcon />
        </Dialog.Close>
      </Dialog.Popup>
    </Dialog.Portal>
  );
}

export function SettingsModalExample() {
  return (
    <Dialog.Root>
      <Dialog.Trigger className={styles.Button}>Open settings</Dialog.Trigger>
      <AppDialogContent title="Workspace settings" description="Changes apply immediately.">
        <div className={styles.Section}>
          <h3 className={styles.SectionTitle}>Appearance</h3>
          <p className={styles.SectionBody}>Theme, density, and accent color.</p>
        </div>
        <div className={styles.Section}>
          <h3 className={styles.SectionTitle}>Notifications</h3>
          <p className={styles.SectionBody}>Mentions, replies, and weekly digests.</p>
        </div>
        <div className={styles.EndActions}>
          <Dialog.Close className={styles.Button}>Done</Dialog.Close>
        </div>
      </AppDialogContent>
    </Dialog.Root>
  );
}
