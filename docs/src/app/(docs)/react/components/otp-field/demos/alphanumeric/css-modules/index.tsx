import * as React from 'react';
import { OTPField } from '@base-ui/react/otp-field';
import styles from '../../shared.module.css';

const CODE_LENGTH = 6;

export default function OTPFieldAlphanumericDemo() {
  const id = React.useId();
  const inputId = `${id}-input`;
  const descriptionId = `${id}-description`;

  return (
    <OTPField.Root length={CODE_LENGTH} validationType="alphanumeric" className={styles.Field}>
      <label htmlFor={inputId} className={styles.Label}>
        Recovery code
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
        Accept letters and numbers for backup codes such as{' '}
        <span className={styles.Code}>A7C9XZ</span>.
      </p>
    </OTPField.Root>
  );
}
