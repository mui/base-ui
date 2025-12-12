import { Dialog } from '@base-ui/react/dialog';
import styles from './index.module.css';

export default function ExampleUncontainedDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger className={styles.Button}>Open dialog</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.Backdrop} />
        <Dialog.Viewport className={styles.Viewport}>
          <Dialog.Popup className={styles.PopupRoot}>
            <Dialog.Close className={styles.Close} aria-label="Close">
              <XIcon className={styles.CloseIcon} />
            </Dialog.Close>
            <div className={styles.Popup} />
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function XIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
