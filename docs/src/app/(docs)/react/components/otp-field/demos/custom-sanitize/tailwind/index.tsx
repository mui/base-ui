'use client';
import * as React from 'react';
import { OTPField } from '@base-ui/react/otp-field';

const CODE_LENGTH = 6;

function sanitizeTierCode(value: string) {
  return value.replace(/[^0-3]/g, '');
}

export default function OTPFieldCustomSanitizeDemo() {
  const id = React.useId();
  const descriptionId = `${id}-description`;
  const invalidId = `${id}-invalid`;
  const [lastInvalidValue, setLastInvalidValue] = React.useState<string | null>(null);

  return (
    <OTPField.Root
      id={id}
      length={CODE_LENGTH}
      validationType="none"
      inputMode="numeric"
      sanitizeValue={sanitizeTierCode}
      onValueInvalid={(value) => setLastInvalidValue(value)}
      aria-describedby={`${descriptionId} ${invalidId}`}
      className="flex w-full max-w-80 flex-col items-start gap-1"
    >
      <label htmlFor={id} className="text-sm font-bold text-gray-900">
        Tier code
      </label>
      <OTPField.Group className="flex w-full gap-2">
        {Array.from({ length: CODE_LENGTH }, (_, index) => (
          <OTPField.Input
            key={index}
            className="box-border m-0 h-11 w-10 rounded-lg border border-gray-300 bg-transparent text-center font-inherit text-lg font-medium text-gray-900 outline-none focus:outline focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800"
            aria-label={`Character ${index + 1} of ${CODE_LENGTH}`}
          />
        ))}
      </OTPField.Group>
      <p id={descriptionId} className="m-0 text-sm text-gray-600">
        Only digits <code>0-3</code> are accepted, while <code>inputMode="numeric"</code> keeps the
        numeric keyboard hint.
      </p>
      <p id={invalidId} className="m-0 text-sm text-gray-600" aria-live="polite">
        {lastInvalidValue == null ? (
          'Try typing or pasting 1209 to see custom invalid-input feedback.'
        ) : (
          <React.Fragment>
            Ignored unsupported characters from <code>{lastInvalidValue}</code>.
          </React.Fragment>
        )}
      </p>
    </OTPField.Root>
  );
}
