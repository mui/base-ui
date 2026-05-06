import * as React from 'react';
import { Fullscreen } from '@base-ui/react/fullscreen';
import styles from './index.module.css';

export default function ExampleFullscreenPortal() {
  return (
    <Fullscreen.Root>
      <Fullscreen.Trigger className={styles.Trigger}>
        <ExpandIcon />
        Open fullscreen
      </Fullscreen.Trigger>
      <Fullscreen.Portal>
        <Fullscreen.Container className={styles.Container}>
          <h2 className={styles.Title}>Mounted only when open</h2>
          <p className={styles.Description}>This content is only mounted while in fullscreen.</p>
          <Fullscreen.Close className={styles.Close}>
            <CloseIcon />
            Close
          </Fullscreen.Close>
        </Fullscreen.Container>
      </Fullscreen.Portal>
    </Fullscreen.Root>
  );
}

function ExpandIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" {...props}>
      <path d="M2 5V2H5M10 7V10H7M5 10H2V7M7 2H10V5" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}

function CloseIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" {...props}>
      <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}
