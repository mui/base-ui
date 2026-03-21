import * as React from 'react';
import { OTPField } from '@base-ui/react/otp-field';
import styles from '../../shared.module.css';

const CODE_LENGTH = 6;

export default function OTPFieldAlphanumericDemo() {
  const id = React.useId();
  const descriptionId = `${id}-description`;

  return (
    <OTPField.Root
      id={id}
      length={CODE_LENGTH}
      validationType="alphanumeric"
      aria-describedby={descriptionId}
      className={styles.Field}
    >
      <label htmlFor={id} className={styles.Label}>
        Recovery code
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
        Accept letters and numbers for backup codes such as{' '}
        <span className={styles.Code}>A7C9XZ</span>.
      </p>
    </OTPField.Root>
  );
}
