'use client';
import * as React from 'react';
import { OTPFieldPreview as OTPField } from '@base-ui/react/otp-field';
import { useInvalidFeedback } from '../useInvalidFeedback';
import styles from './index.module.css';

const CODE_LENGTH = 6;

function sanitizeTierCode(value: string) {
  return value.replace(/[^0-3]/g, '');
}

function getInvalidClassName(invalidPulse: number, evenClassName: string, oddClassName: string) {
  if (invalidPulse === 0) {
    return '';
  }

  return invalidPulse % 2 === 0 ? evenClassName : oddClassName;
}

export default function OTPFieldCustomSanitizeDemo() {
  const id = React.useId();
  const descriptionId = `${id}-description`;

  const {
    activeInvalidIndex,
    handleValueChange,
    handleValueInvalid,
    invalidPulse,
    setFocusedIndex,
    statusMessage,
  } = useInvalidFeedback();

  const invalidClassName = getInvalidClassName(
    invalidPulse,
    styles.InputInvalidB,
    styles.InputInvalidA,
  );

  return (
    <div className={styles.Field}>
      <label htmlFor={id} className={styles.Label}>
        Tier code
      </label>
      <OTPField.Root
        id={id}
        length={CODE_LENGTH}
        validationType="none"
        inputMode="numeric"
        sanitizeValue={sanitizeTierCode}
        onValueChange={handleValueChange}
        onValueInvalid={handleValueInvalid}
        aria-describedby={descriptionId}
        className={styles.Root}
      >
        {Array.from({ length: CODE_LENGTH }, (_, index) => (
          <OTPField.Input
            key={index}
            className={`${styles.Input} ${activeInvalidIndex === index ? invalidClassName : ''}`.trim()}
            aria-label={`Character ${index + 1} of ${CODE_LENGTH}`}
            onFocus={() => {
              setFocusedIndex(index);
            }}
          />
        ))}
      </OTPField.Root>
      <p id={descriptionId} className={styles.Description}>
        Digits <span className={styles.Code}>0-3</span> only.
      </p>
      <span aria-live="polite" className={styles.ScreenReaderOnly}>
        {statusMessage}
      </span>
    </div>
  );
}
