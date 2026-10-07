'use client';
import * as React from 'react';
import { AlertDialog } from '@base-ui/react/alert-dialog';
import { Menu } from '@base-ui/react/menu';
import styles from './index.module.css';

export default function ExampleAlertDialog() {
  const [dialogOpen, setDialogOpen] = React.useState(false);

  return (
    <React.Fragment>
      <Menu.Root>
        <Menu.Trigger className={styles.Button}>
          Playlist <CaretDownIcon />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className={styles.Positioner} sideOffset={8} align="start">
            <Menu.Popup className={styles.MenuPopup}>
              <Menu.Item className={styles.MenuItem}>Play</Menu.Item>
              <Menu.Item className={styles.MenuItem}>Share</Menu.Item>
              <Menu.Separator className={styles.Separator} />
              {/* Open the alert dialog when the menu item is clicked */}
              <Menu.Item className={styles.MenuItem} onClick={() => setDialogOpen(true)}>
                Delete…
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      {/* Control the alert dialog state */}
      <AlertDialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className={styles.Backdrop} />
          <AlertDialog.Popup className={styles.DialogPopup}>
            <div className={styles.Intro}>
              <AlertDialog.Title className={styles.Title}>Delete playlist?</AlertDialog.Title>
              <AlertDialog.Description className={styles.Description}>
                You can't undo this action.
              </AlertDialog.Description>
            </div>
            <div className={styles.Actions}>
              <AlertDialog.Close className={styles.Button}>Cancel</AlertDialog.Close>
              <AlertDialog.Close data-color="red" className={styles.Button}>
                Delete
              </AlertDialog.Close>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </React.Fragment>
  );
}

function CaretDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M12 6H4l4 4.5z" />
    </svg>
  );
}
