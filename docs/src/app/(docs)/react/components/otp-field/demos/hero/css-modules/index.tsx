import * as React from 'react';
import { OTPField } from '@base-ui/react/otp-field';
import styles from './index.module.css';

const OTP_LENGTH = 6;

export default function ExampleOTPField() {
  const id = React.useId();
  const inputId = `${id}-input`;
  const descriptionId = `${id}-description`;
  return (
    <OTPField.Root length={OTP_LENGTH} className={styles.Field}>
      <label htmlFor={inputId} className={styles.Label}>
        Verification code
      </label>
      <OTPField.Group aria-describedby={descriptionId} className={styles.Group}>
        {Array.from({ length: OTP_LENGTH }, (_, index) => (
          <OTPField.Input
            key={index}
            className={styles.Input}
            id={index === 0 ? inputId : undefined}
            aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
          />
        ))}
      </OTPField.Group>
      <p id={descriptionId} className={styles.Description}>
        Enter the 6-digit code we sent to your device.
      </p>
    </OTPField.Root>
  );
}
