'use client';
import * as React from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { Menu } from '@base-ui/react/menu';
import styles from './index.module.css';

export default function ExampleDialog() {
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
              {/* Open the dialog when the menu item is clicked */}
              <Menu.Item className={styles.MenuItem} onClick={() => setDialogOpen(true)}>
                Delete…
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      {/* Control the dialog state */}
      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className={styles.Backdrop} />
          <Dialog.Popup className={styles.DialogPopup}>
            <div className={styles.Intro}>
              <Dialog.Title className={styles.Title}>Delete playlist</Dialog.Title>
              <Dialog.Description className={styles.Description}>
                This will permanently delete the playlist. This action cannot be undone.
              </Dialog.Description>
            </div>
            <div className={styles.Actions}>
              <Dialog.Close className={styles.Button}>Cancel</Dialog.Close>
              <Dialog.Close className={styles.Button}>Delete</Dialog.Close>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
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
