'use client';
import * as React from 'react';
import { PasswordToggleFieldPreview as PasswordToggleField } from '@base-ui/react/password-toggle-field';
import styles from './index.module.css';

export default function ExamplePasswordToggleField() {
  const id = React.useId();
  return (
    <div className={styles.Field}>
      <label htmlFor={id} className={styles.Label}>
        Password
      </label>
      <PasswordToggleField.Root className={styles.Root}>
        <PasswordToggleField.Input
          id={id}
          className={styles.Input}
          placeholder="Enter your password"
        />
        <PasswordToggleField.Toggle
          className={styles.Toggle}
          aria-label="Show password"
          render={(props, state) => (
            <button type="button" {...props}>
              {state.pressed ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          )}
        />
      </PasswordToggleField.Root>
    </div>
  );
}

function EyeIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function EyeOffIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path
        d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.2 4.2M9.4 5.2A9.7 9.7 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-2.4 3.3M6.2 6.2A17 17 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 3-.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}
