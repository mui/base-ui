import * as React from 'react';
import { OTPField } from '@base-ui/react/otp-field';
import styles from './index.module.css';

const OTP_LENGTH = 6;

export default function OTPFieldGroupedDemo() {
  const id = React.useId();

  return (
    <div className={styles.Field}>
      <label htmlFor={id} className={styles.Label}>
        Verification code
      </label>
      <OTPField.Root id={id} length={OTP_LENGTH} className={styles.Root}>
        <OTPField.Group className={styles.Group}>
          {Array.from({ length: 3 }, (_, index) => (
            <OTPField.Input
              key={index}
              className={styles.Input}
              aria-label={`Character ${index + 1} of ${OTP_LENGTH}`}
            />
          ))}
        </OTPField.Group>
        <OTPField.Separator className={styles.Separator}>
          <SeparatorMark className={styles.SeparatorIcon} />
        </OTPField.Separator>
        <OTPField.Group className={styles.Group}>
          {Array.from({ length: 3 }, (_, index) => (
            <OTPField.Input
              key={index + 3}
              className={styles.Input}
              aria-label={`Character ${index + 4} of ${OTP_LENGTH}`}
            />
          ))}
        </OTPField.Group>
      </OTPField.Root>
    </div>
  );
}

function SeparatorMark(props: React.ComponentProps<'svg'>) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 4" width="20" height="4" fill="none" {...props}>
      <path d="M2 2H18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
