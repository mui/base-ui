'use client';
import * as React from 'react';
import { PasswordFieldPreview as PasswordField } from '@base-ui/react/password-field';
import styles from './index.module.css';

export default function ExamplePasswordFieldToggleIcon() {
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
  const maskId = React.useId();
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16">
        <rect width="16" height="16" fill="white" />
        <path d="M2.53 1.47l12 12" stroke="black" strokeWidth="1.5" />
      </mask>
      <g mask={`url(#${maskId})`}>
        <path
          d="M1.333 8s2.334-4.667 6.667-4.667S14.667 8 14.667 8 12.333 12.667 8 12.667 1.333 8 1.333 8Z"
          stroke="currentColor"
          strokeWidth="1"
        />
        <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1" />
      </g>
      <path d="M2 2l12 12" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}
