'use client';
import * as React from 'react';
import { OTPField } from '@base-ui/react/otp-field';

const CODE_LENGTH = 6;
const inputClassName =
  'box-border m-0 h-11 w-10 rounded-lg border border-gray-300 bg-transparent text-center font-inherit text-lg font-medium text-gray-900 outline-none focus:outline focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800';

function sanitizeInviteCode(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

export default function OTPFieldCustomSanitizeDemo() {
  const id = React.useId();
  const inputId = `${id}-input`;
  const descriptionId = `${id}-description`;

  return (
    <OTPField.Root
      length={CODE_LENGTH}
      validationType="none"
      sanitizeValue={sanitizeInviteCode}
      className="flex w-full max-w-80 flex-col items-start gap-1"
    >
      <label htmlFor={inputId} className="text-sm font-medium text-gray-900">
        Invite code
      </label>
      <OTPField.Group aria-describedby={descriptionId} className="flex w-full gap-2">
        {Array.from({ length: CODE_LENGTH }, (_, index) => (
          <OTPField.Input
            key={index}
            className={inputClassName}
            id={index === 0 ? inputId : undefined}
            aria-label={`Character ${index + 1} of ${CODE_LENGTH}`}
          />
        ))}
      </OTPField.Group>
      <p id={descriptionId} className="m-0 text-sm text-gray-600">
        Normalize pasted values like <code>ab-12 cd</code> before they reach state.
      </p>
    </OTPField.Root>
  );
}
