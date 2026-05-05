import * as React from 'react';
import { OTPFieldPreview as OTPField } from '@base-ui/react/otp-field';

const OTP_LENGTH = 6;

export default function OTPFieldGroupedDemo() {
  const id = React.useId();

  return (
    <div className="flex w-full max-w-80 flex-col items-start gap-1">
      <label htmlFor={id} className="text-sm font-bold text-gray-900">
        Verification code
      </label>
      <OTPField.Root id={id} length={OTP_LENGTH} className="flex w-full items-center gap-2">
        <div className="flex gap-2">
          {Array.from({ length: 3 }, (_, index) => (
            <OTPField.Input
              key={index}
              className="box-border m-0 h-11 w-10 rounded-lg border border-gray-300 bg-transparent text-center font-inherit text-lg font-medium text-gray-900 outline-none focus:outline-solid focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800"
              aria-label={`Character ${index + 1} of ${OTP_LENGTH}`}
            />
          ))}
        </div>
        <OTPField.Separator className="flex w-4 items-center justify-center text-gray-500">
          <SeparatorMark />
        </OTPField.Separator>
        <div className="flex gap-2">
          {Array.from({ length: 3 }, (_, index) => (
            <OTPField.Input
              key={index + 3}
              className="box-border m-0 h-11 w-10 rounded-lg border border-gray-300 bg-transparent text-center font-inherit text-lg font-medium text-gray-900 outline-none focus:outline-solid focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800"
              aria-label={`Character ${index + 4} of ${OTP_LENGTH}`}
            />
          ))}
        </div>
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
