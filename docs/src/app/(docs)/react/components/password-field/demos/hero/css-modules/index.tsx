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
      <PasswordField.Root className={styles.Root}>
        <PasswordField.Input id={id} className={styles.Input} placeholder="Enter your password" />
        <PasswordField.Toggle
          className={styles.Toggle}
          aria-label="Show password"
          render={(props, state) => (
            <button type="button" {...props}>
              {state.pressed ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          )}
        />
      </PasswordField.Root>
    </div>
  );
}

function EyeIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path
        d="M1.333 8s2.334-4.667 6.667-4.667S14.667 8 14.667 8 12.333 12.667 8 12.667 1.333 8 1.333 8Z"
        stroke="currentColor"
        strokeWidth="1"
      />
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

function EyeOffIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path
        d="M2 2l12 12M7.067 7.067a2 2 0 0 0 2.8 2.8M6.267 3.467A6.467 6.467 0 0 1 8 3.333c4.333 0 6.667 4.667 6.667 4.667a11.333 11.333 0 0 1-1.6 2.2M4.133 4.133A11.333 11.333 0 0 0 1.333 8s2.334 4.667 6.667 4.667a6.467 6.467 0 0 0 2-.334"
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  );
}
