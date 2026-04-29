import * as React from 'react';
import { OTPFieldPreview as OTPField } from '@base-ui/react/otp-field';

const OTP_LENGTH = 6;

export default function OTPFieldGroupedDemo() {
  const id = React.useId();

  return (
    <div className="flex w-full max-w-80 flex-col items-start gap-1">
      <label htmlFor={id} className="text-sm font-bold text-neutral-950 dark:text-white">
        Verification code
      </label>
      <OTPField.Root id={id} length={OTP_LENGTH} className="flex w-full items-center gap-2">
        <div className="flex gap-2">
          {Array.from({ length: 3 }, (_, index) => (
            <OTPField.Input
              key={index}
              className="box-border m-0 h-10 w-10 rounded-none border border-neutral-950 bg-transparent text-center font-inherit text-base font-normal text-neutral-950 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-800 dark:border-white dark:text-white"
              aria-label={`Character ${index + 1} of ${OTP_LENGTH}`}
            />
          ))}
        </div>
        <OTPField.Separator className="h-px w-4 bg-current text-neutral-950 dark:text-white" />
        <div className="flex gap-2">
          {Array.from({ length: 3 }, (_, index) => (
            <OTPField.Input
              key={index + 3}
              className="box-border m-0 h-10 w-10 rounded-none border border-neutral-950 bg-transparent text-center font-inherit text-base font-normal text-neutral-950 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-800 dark:border-white dark:text-white"
              aria-label={`Character ${index + 4} of ${OTP_LENGTH}`}
            />
          ))}
        </div>
      </OTPField.Root>
    </div>
  );
}
