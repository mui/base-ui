import * as React from 'react';
import { OTPField } from '@base-ui/react/otp-field';
import styles from './index.module.css';

const CODE_LENGTH = 6;

export default function OTPFieldPasswordDemo() {
  const id = React.useId();
  const descriptionId = `${id}-description`;

  return (
    <OTPField.Root
      id={id}
      length={CODE_LENGTH}
      mask
      aria-describedby={descriptionId}
      className={styles.Field}
    >
      <label htmlFor={id} className={styles.Label}>
        Access code
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
        Use <span className={styles.Code}>mask</span> to obscure the code on shared screens.
      </p>
    </OTPField.Root>
  );
}
