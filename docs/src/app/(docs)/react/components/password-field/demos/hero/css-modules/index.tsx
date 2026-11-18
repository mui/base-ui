'use client';
import * as React from 'react';
import { PasswordFieldPreview as PasswordField } from '@base-ui/react/password-field';
import styles from './index.module.css';

export default function ExamplePasswordField() {
  const id = React.useId();
  return (
    <div className={styles.Field}>
      <label htmlFor={id} className={styles.Label}>
        Password
      </label>
      <PasswordField.Root id={id} className={styles.Root}>
        <PasswordField.Input className={styles.Input} placeholder="Enter your password" />
        <PasswordField.Toggle className={styles.Toggle} aria-label="Show password">
          <PasswordField.ToggleIndicator keepMounted className={styles.Indicator}>
            <PadlockIcon className={styles.Icon} />
          </PasswordField.ToggleIndicator>
        </PasswordField.Toggle>
      </PasswordField.Root>
    </div>
  );
}

function PadlockIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...props}>
      <path
        d="M5.5 10V5.5a2.5 2.5 0 0 1 5 0V7"
        stroke="currentColor"
        strokeWidth="1"
        className={styles.Shackle}
      />
      <rect x="3" y="7" width="10" height="7" fill="currentColor" />
    </svg>
  );
}
