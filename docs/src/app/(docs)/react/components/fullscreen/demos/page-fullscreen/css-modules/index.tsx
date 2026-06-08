'use client';
import * as React from 'react';
import { Fullscreen } from '@base-ui/react/fullscreen';
import styles from './index.module.css';

export default function ExampleFullscreenPage() {
  return (
    <Fullscreen.Root target={getDocumentElement}>
      <Fullscreen.Trigger className={styles.Trigger}>
        <ExpandIcon />
        Fullscreen the page
      </Fullscreen.Trigger>
    </Fullscreen.Root>
  );
}

function getDocumentElement() {
  if (typeof document === 'undefined') {
    return null;
  }
  return document.documentElement;
}

function ExpandIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" {...props}>
      <path d="M2 5V2H5M10 7V10H7M5 10H2V7M7 2H10V5" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}
