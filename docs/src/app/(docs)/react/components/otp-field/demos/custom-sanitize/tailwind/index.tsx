'use client';
import * as React from 'react';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { visuallyHidden } from '@base-ui/utils/visuallyHidden';
import { OTPField } from '@base-ui/react/otp-field';

const CODE_LENGTH = 6;

function sanitizeTierCode(value: string) {
  return value.replace(/[^0-3]/g, '');
}

export default function OTPFieldCustomSanitizeDemo() {
  const id = React.useId();
  const descriptionId = `${id}-description`;
  const invalidTimeout = useTimeout();
  const [invalidCount, setInvalidCount] = React.useState(0);
  const [statusMessage, setStatusMessage] = React.useState('');
  const invalidStyles =
    invalidCount === 0
      ? undefined
      : {
          borderColor: 'var(--color-red)',
          outline: '2px solid var(--color-red-800)',
          outlineOffset: '-1px',
          animation: `${invalidCount % 2 === 0 ? 'otp-field-shake-b' : 'otp-field-shake-a'} 180ms ease-in-out`,
        };

  return (
    <OTPField.Root
      id={id}
      length={CODE_LENGTH}
      validationType="none"
      inputMode="numeric"
      sanitizeValue={sanitizeTierCode}
      onValueInvalid={(value) => {
        setInvalidCount((count) => count + 1);
        setStatusMessage(`Unsupported characters were ignored from ${value}.`);
        invalidTimeout.start(400, () => {
          setInvalidCount(0);
          setStatusMessage('');
        });
      }}
      aria-describedby={descriptionId}
      className="flex w-full max-w-80 flex-col items-start gap-1"
    >
      <style>{`
        @keyframes otp-field-shake-a {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }

        @keyframes otp-field-shake-b {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
      `}</style>
      <label htmlFor={id} className="text-sm font-bold text-gray-900">
        Tier code
      </label>
      <OTPField.Group className="flex w-full gap-2">
        {Array.from({ length: CODE_LENGTH }, (_, index) => (
          <OTPField.Input
            key={index}
            className="box-border m-0 h-11 w-10 rounded-lg border border-gray-300 bg-transparent text-center font-inherit text-lg font-medium text-gray-900 outline-none focus:outline focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800"
            style={invalidStyles}
            aria-label={`Character ${index + 1} of ${CODE_LENGTH}`}
          />
        ))}
      </OTPField.Group>
      <p id={descriptionId} className="m-0 text-sm text-gray-600">
        Digits <code>0-3</code> only.
      </p>
      <span aria-live="polite" style={visuallyHidden}>
        {statusMessage}
      </span>
    </OTPField.Root>
  );
}
