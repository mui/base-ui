import * as React from 'react';
import { OTPFieldPreview as OTPField } from '@base-ui/react/otp-field';

const CODE_LENGTH = 6;

export default function OTPFieldAlphanumericDemo() {
  const id = React.useId();
  const descriptionId = `${id}-description`;

  return (
    <div className="flex w-full max-w-80 flex-col items-start gap-1">
      <label htmlFor={id} className="text-sm leading-5 font-bold text-gray-950 dark:text-white">
        Recovery code
      </label>
      <OTPField.Root
        id={id}
        length={CODE_LENGTH}
        validationType="alphanumeric"
        aria-describedby={descriptionId}
        className="flex w-full gap-2"
      >
        {Array.from({ length: CODE_LENGTH }, (_, index) => (
          <OTPField.Input
            key={index}
            className="box-border m-0 h-10 w-10 rounded-none border border-gray-950 bg-transparent text-center font-inherit text-base font-normal text-gray-950 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-800 dark:border-white dark:text-white"
            aria-label={`Character ${index + 1} of ${CODE_LENGTH}`}
          />
        ))}
      </OTPField.Root>
      <p id={descriptionId} className="m-0 text-sm leading-5 text-gray-600 dark:text-gray-400">
        Accept letters and numbers for backup codes such as{' '}
        <code className="font-mono">A7C9XZ</code>.
      </p>
    </div>
  );
}
