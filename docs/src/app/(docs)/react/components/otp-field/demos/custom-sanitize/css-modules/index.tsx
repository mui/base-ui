'use client';
import * as React from 'react';
import { OTPField } from '@base-ui/react/otp-field';
import styles from '../../shared.module.css';

const CODE_LENGTH = 6;

function sanitizeInviteCode(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

export default function OTPFieldCustomSanitizeDemo() {
  const id = React.useId();
  const inputId = `${id}-input`;
  const descriptionId = `${id}-description`;

  return (
    <OTPField.Root
      length={CODE_LENGTH}
      validationType="none"
      sanitizeValue={sanitizeInviteCode}
      className={styles.Field}
    >
      <label htmlFor={inputId} className={styles.Label}>
        Invite code
      </label>
      <OTPField.Group aria-describedby={descriptionId} className={styles.Group}>
        {Array.from({ length: CODE_LENGTH }, (_, index) => (
          <OTPField.Input
            key={index}
            className={styles.Input}
            id={index === 0 ? inputId : undefined}
            aria-label={`Character ${index + 1} of ${CODE_LENGTH}`}
          />
        ))}
      </OTPField.Group>
      <p id={descriptionId} className={styles.Description}>
        Normalize pasted values like <span className={styles.Code}>ab-12 cd</span> before they reach
        state.
      </p>
    </OTPField.Root>
  );
}
