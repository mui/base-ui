'use client';
import * as React from 'react';
import { PasswordFieldPreview as PasswordField } from '@base-ui/react/password-field';
import styles from './index.module.css';

export default function ExamplePasswordFieldAnimateBetweenIcons() {
  const id = React.useId();
  return (
    <div className={styles.Field}>
      <label htmlFor={id} className={styles.Label}>
        Password
      </label>
      <PasswordField.Root id={id} className={styles.Root}>
        <PasswordField.Input className={styles.Input} placeholder="Enter your password" />
        <PasswordField.Toggle className={styles.Toggle} aria-label="Show password">
          <PasswordField.ToggleIndicator className={styles.Indicator} match="password-masked">
            <EyeOffIcon />
          </PasswordField.ToggleIndicator>
          <PasswordField.ToggleIndicator className={styles.Indicator} match="password-visible">
            <EyeIcon />
          </PasswordField.ToggleIndicator>
        </PasswordField.Toggle>
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
      <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1" />
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
        d="M5.854 3.733C6.503 3.485 7.219 3.333 8 3.333C12.333 3.333 14.667 8 14.667 8C14.667 8 13.996 9.341 12.707 10.585M11.537 11.537C10.571 12.188 9.388 12.667 8 12.667C3.667 12.667 1.333 8 1.333 8C1.333 8 2.411 5.844 4.463 4.463"
        stroke="currentColor"
        strokeWidth="1"
      />
      <path
        d="M9.768 9.768A2.5 2.5 0 0 1 6.232 6.232M7.646 5.525A2.5 2.5 0 0 1 10.475 8.354"
        stroke="currentColor"
        strokeWidth="1"
      />
      <path d="M2 2l12 12" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}
