'use client';
import * as React from 'react';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { visuallyHidden } from '@base-ui/utils/visuallyHidden';
import { OTPField } from '@base-ui/react/otp-field';
import styles from '../../shared.module.css';

const CODE_LENGTH = 6;

function sanitizeTierCode(value: string) {
  return value.replace(/[^0-3]/g, '');
}

export default function OTPFieldCustomSanitizeDemo() {
  const id = React.useId();
  const descriptionId = `${id}-description`;
  const invalidTimeout = useTimeout();
  const [invalidCount, setInvalidCount] = React.useState(0);
  const [statusMessage, setStatusMessage] = React.useState('');

  const invalidClassName =
    invalidCount === 0 ? '' : invalidCount % 2 === 0 ? styles.InputInvalidB : styles.InputInvalidA;

  return (
    <OTPField.Root
      id={id}
      length={CODE_LENGTH}
      validationType="none"
      inputMode="numeric"
      sanitizeValue={sanitizeTierCode}
      onValueInvalid={(value) => {
        setInvalidCount((count) => count + 1);
        setStatusMessage(`Unsupported characters were ignored from ${value}.`);
        invalidTimeout.start(400, () => {
          setInvalidCount(0);
          setStatusMessage('');
        });
      }}
      aria-describedby={descriptionId}
      className={styles.Field}
    >
      <label htmlFor={id} className={styles.Label}>
        Tier code
      </label>
      <OTPField.Group className={styles.Group}>
        {Array.from({ length: CODE_LENGTH }, (_, index) => (
          <OTPField.Input
            key={index}
            className={`${styles.Input} ${invalidClassName}`.trim()}
            aria-label={`Character ${index + 1} of ${CODE_LENGTH}`}
          />
        ))}
      </OTPField.Group>
      <p id={descriptionId} className={styles.Description}>
        Digits <span className={styles.Code}>0-3</span> only.
      </p>
      <span aria-live="polite" style={visuallyHidden}>
        {statusMessage}
      </span>
    </OTPField.Root>
  );
}
