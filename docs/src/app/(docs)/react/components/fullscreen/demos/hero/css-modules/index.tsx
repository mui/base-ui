import * as React from 'react';
import { Fullscreen } from '@base-ui/react/fullscreen';
import styles from './index.module.css';

export default function ExampleFullscreen() {
  return (
    <Fullscreen.Root>
      <Fullscreen.Container className={styles.Container}>
        <p className={styles.Caption}>Preview</p>
        <span className={styles.Content}>
          <span className={styles.ContentDot} aria-hidden="true" />
          Live broadcast
        </span>

        <Fullscreen.Trigger className={styles.Trigger}>
          <ExpandIcon />
          Enter fullscreen
        </Fullscreen.Trigger>
        <Fullscreen.Close className={styles.Close}>
          <CloseIcon />
          Close
        </Fullscreen.Close>
      </Fullscreen.Container>
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
