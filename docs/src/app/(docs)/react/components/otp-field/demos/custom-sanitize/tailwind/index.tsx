'use client';
import * as React from 'react';
import { OTPField } from '@base-ui/react/otp-field';
import { useInvalidFeedback } from '../useInvalidFeedback';

const CODE_LENGTH = 6;

function sanitizeTierCode(value: string) {
  return value.replace(/[^0-3]/g, '');
}

function getInvalidClassName(invalidPulse: number, evenClassName: string, oddClassName: string) {
  if (invalidPulse === 0) {
    return '';
  }

  return invalidPulse % 2 === 0 ? evenClassName : oddClassName;
}

export default function OTPFieldCustomSanitizeDemo() {
  const id = React.useId();
  const {
    activeInvalidIndex,
    handleValueChange,
    handleValueInvalid,
    invalidPulse,
    setFocusedIndex,
    statusMessage,
  } = useInvalidFeedback();
  const descriptionId = `${id}-description`;
  const invalidClassName = getInvalidClassName(
    invalidPulse,
    'otp-field-input-invalid-b',
    'otp-field-input-invalid-a',
  );

  return (
    <OTPField.Root
      id={id}
      length={CODE_LENGTH}
      validationType="none"
      inputMode="numeric"
      sanitizeValue={sanitizeTierCode}
      onValueChange={handleValueChange}
      onValueInvalid={handleValueInvalid}
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

        .otp-field-input-invalid-a {
          border-color: var(--color-red);
          outline: 2px solid var(--color-red-800);
          outline-offset: -1px;
          animation: otp-field-shake-a 180ms ease-in-out;
        }

        .otp-field-input-invalid-b {
          border-color: var(--color-red);
          outline: 2px solid var(--color-red-800);
          outline-offset: -1px;
          animation: otp-field-shake-b 180ms ease-in-out;
        }
      `}</style>
      <label htmlFor={id} className="text-sm font-bold text-gray-900">
        Tier code
      </label>
      <OTPField.Group className="flex w-full gap-2">
        {Array.from({ length: CODE_LENGTH }, (_, index) => (
          <OTPField.Input
            key={index}
            className={`box-border m-0 h-11 w-10 rounded-lg border border-gray-300 bg-transparent text-center font-inherit text-lg font-medium text-gray-900 outline-none focus:outline focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800 ${
              activeInvalidIndex === index ? invalidClassName : ''
            }`.trim()}
            aria-label={`Character ${index + 1} of ${CODE_LENGTH}`}
            onFocus={() => {
              setFocusedIndex(index);
            }}
          />
        ))}
      </OTPField.Group>
      <p id={descriptionId} className="m-0 text-sm text-gray-600">
        Digits <code>0-3</code> only.
      </p>
      <span aria-live="polite" className="sr-only">
        {statusMessage}
      </span>
    </OTPField.Root>
  );
}
