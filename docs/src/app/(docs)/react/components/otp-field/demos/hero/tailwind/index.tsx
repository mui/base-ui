import * as React from 'react';
import { OTPFieldPreview as OTPField } from '@base-ui/react/otp-field';

const OTP_LENGTH = 6;

export default function ExampleOTPField() {
  const id = React.useId();
  const descriptionId = `${id}-description`;

  return (
    <div className="flex w-full max-w-80 flex-col items-start gap-1">
      <label htmlFor={id} className="text-sm leading-5 font-bold text-gray-950 dark:text-white">
        Verification code
      </label>
      <OTPField.Root
        id={id}
        length={OTP_LENGTH}
        aria-describedby={descriptionId}
        className="flex w-full gap-2"
      >
        {Array.from({ length: OTP_LENGTH }, (_, index) => (
          <OTPField.Input
            key={index}
            className="box-border m-0 h-10 w-10 rounded-none border border-gray-950 bg-transparent text-center font-inherit text-base font-normal text-gray-950 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-800 dark:border-white dark:text-white"
            aria-label={`Character ${index + 1} of ${OTP_LENGTH}`}
          />
        ))}
      </OTPField.Root>
      <p id={descriptionId} className="m-0 text-sm leading-5 text-gray-500 dark:text-gray-400">
        Enter the 6-character code we sent to your device.
      </p>
    </div>
  );
}
