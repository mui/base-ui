import * as React from 'react';
import { OTPField } from '@base-ui/react';
import './OTPField.css';

const OTP_LENGTH = 6;

export const Basic = () => {
  const id = React.useId();
  const descriptionId = `${id}-description`;

  return (
    <div className="Field">
      <label htmlFor={id} className="Label">
        Verification code
      </label>
      <OTPField.Root id={id} length={OTP_LENGTH} aria-describedby={descriptionId} className="Root">
        {Array.from({ length: OTP_LENGTH }, (_, index) => (
          <OTPField.Input
            key={index}
            className="Input"
            aria-label={index === 0 ? undefined : `Character ${index + 1} of ${OTP_LENGTH}`}
          />
        ))}
      </OTPField.Root>
      <p id={descriptionId} className="Description">
        Enter the 6-character code we sent to your device.
      </p>
    </div>
  );
};

export const Filled = () => {
  const id = React.useId();
  const descriptionId = `${id}-description`;

  return (
    <div className="Field">
      <label htmlFor={id} className="Label">
        Verification code
      </label>
      <OTPField.Root
        id={id}
        length={OTP_LENGTH}
        defaultValue="482913"
        aria-describedby={descriptionId}
        className="Root"
      >
        {Array.from({ length: OTP_LENGTH }, (_, index) => (
          <OTPField.Input
            key={index}
            className="Input"
            aria-label={index === 0 ? undefined : `Character ${index + 1} of ${OTP_LENGTH}`}
          />
        ))}
      </OTPField.Root>
      <p id={descriptionId} className="Description">
        Enter the 6-character code we sent to your device.
      </p>
    </div>
  );
};

export const Disabled = () => {
  const id = React.useId();
  const descriptionId = `${id}-description`;

  return (
    <div className="Field">
      <label htmlFor={id} className="Label">
        Verification code
      </label>
      <OTPField.Root
        id={id}
        length={OTP_LENGTH}
        disabled
        aria-describedby={descriptionId}
        className="Root"
      >
        {Array.from({ length: OTP_LENGTH }, (_, index) => (
          <OTPField.Input
            key={index}
            className="Input"
            aria-label={index === 0 ? undefined : `Character ${index + 1} of ${OTP_LENGTH}`}
          />
        ))}
      </OTPField.Root>
      <p id={descriptionId} className="Description">
        Enter the 6-character code we sent to your device.
      </p>
    </div>
  );
};
