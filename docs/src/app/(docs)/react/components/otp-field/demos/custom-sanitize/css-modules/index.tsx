'use client';
import * as React from 'react';
import { OTPField } from '@base-ui/react/otp-field';
import styles from '../../shared.module.css';

const CODE_LENGTH = 6;

function sanitizeTierCode(value: string) {
  return value.replace(/[^0-3]/g, '');
}

export default function OTPFieldCustomSanitizeDemo() {
  const id = React.useId();
  const descriptionId = `${id}-description`;
  const invalidId = `${id}-invalid`;
  const [lastInvalidValue, setLastInvalidValue] = React.useState<string | null>(null);

  return (
    <OTPField.Root
      id={id}
      length={CODE_LENGTH}
      validationType="none"
      inputMode="numeric"
      sanitizeValue={sanitizeTierCode}
      onValueInvalid={(value) => setLastInvalidValue(value)}
      aria-describedby={`${descriptionId} ${invalidId}`}
      className={styles.Field}
    >
      <label htmlFor={id} className={styles.Label}>
        Tier code
      </label>
      <OTPField.Group className={styles.Group}>
        {Array.from({ length: CODE_LENGTH }, (_, index) => (
          <OTPField.Input
            key={index}
            className={styles.Input}
            aria-label={`Character ${index + 1} of ${CODE_LENGTH}`}
          />
        ))}
      </OTPField.Group>
      <p id={descriptionId} className={styles.Description}>
        Only digits <span className={styles.Code}>0-3</span> are accepted, while
        <span className={styles.Code}> inputMode="numeric" </span>
        keeps the numeric keyboard hint.
      </p>
      <p id={invalidId} className={styles.Description} aria-live="polite">
        {lastInvalidValue == null ? (
          'Try typing or pasting 1209 to see custom invalid-input feedback.'
        ) : (
          <React.Fragment>
            Ignored unsupported characters from{' '}
            <span className={styles.Code}>{lastInvalidValue}</span>.
          </React.Fragment>
        )}
      </p>
    </OTPField.Root>
  );
}
