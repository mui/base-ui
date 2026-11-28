'use client';
import * as React from 'react';
import { PasswordFieldPreview as PasswordField } from '@base-ui/react/password-field';
import styles from './index.module.css';

export default function ExamplePasswordFieldAnimateIconPath() {
  const id = React.useId();
  return (
    <div className={styles.Field}>
      <PasswordField.Root id={id}>
        <label htmlFor={id} className={styles.Label}>
          Password
        </label>
        <PasswordField.Group className={styles.Group}>
          <PasswordField.Input className={styles.Input} placeholder="Enter your password" />
          <PasswordField.Toggle className={styles.Toggle} aria-label="Show password">
            <PasswordField.ToggleIndicator className={styles.Indicator}>
              <EyeIcon className={styles.Icon} />
            </PasswordField.ToggleIndicator>
          </PasswordField.Toggle>
        </PasswordField.Group>
      </PasswordField.Root>
    </div>
  );
}

function EyeIcon(props: React.ComponentProps<'svg'>) {
  const maskId = React.useId();
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" {...props}>
      <mask id={maskId}>
        <rect width="16" height="16" fill="white" stroke="none" />
        <path
          d="M2.53 1.47l12 12"
          stroke="black"
          strokeWidth="1.5"
          pathLength="1"
          strokeDasharray="1"
          className={styles.Slash}
        />
      </mask>
      <g mask={`url(#${maskId})`}>
        <path d="M1.333 8s2.334-4.667 6.667-4.667S14.667 8 14.667 8 12.333 12.667 8 12.667 1.333 8 1.333 8Z" />
        <circle cx="8" cy="8" r="2.5" />
      </g>
      <path d="M2 2l12 12" pathLength="1" strokeDasharray="1" className={styles.Slash} />
    </svg>
  );
}
