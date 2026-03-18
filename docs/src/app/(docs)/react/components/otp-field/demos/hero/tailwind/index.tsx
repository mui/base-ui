import * as React from 'react';
import { OTPField } from '@base-ui/react/otp-field';

const OTP_LENGTH = 6;

export default function ExampleOTPField() {
  const id = React.useId();
  const inputId = `${id}-input`;
  const descriptionId = `${id}-description`;
  const inputClassName =
    'box-border m-0 h-11 w-11 rounded-lg border border-gray-300 bg-transparent text-center font-inherit text-lg font-medium text-gray-900 outline-none focus:outline focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800';

  return (
    <OTPField.Root length={OTP_LENGTH} className="flex w-full max-w-80 flex-col items-start gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-gray-900">
        Verification code
      </label>
      <OTPField.Group aria-describedby={descriptionId} className="flex w-full gap-2">
        {Array.from({ length: OTP_LENGTH }, (_, index) => (
          <OTPField.Input
            key={index}
            className={inputClassName}
            id={index === 0 ? inputId : undefined}
            aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
          />
        ))}
      </OTPField.Group>
      <p id={descriptionId} className="m-0 text-sm text-gray-600">
        Enter the 6-digit code we sent to your device.
      </p>
    </OTPField.Root>
  );
}
