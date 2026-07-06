import { Dialog } from '@base-ui-components/react/dialog';
import type { PropsWithChildren } from 'react';

import styles from './default-dialog.module.scss';

type Props = PropsWithChildren & {
  heading: string;
  isOpen: boolean;
  toggle: (value: boolean) => void;
};

function DefaultDialog({ children, heading, isOpen, toggle }: Props) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={toggle}>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.backdrop} />

        <Dialog.Popup className={styles.popup}>
          <header className={styles.header}>
            <Dialog.Title className={styles.title}>{heading}</Dialog.Title>
            <Dialog.Close>Close</Dialog.Close>
          </header>

          <div>{children}</div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export { DefaultDialog };
