'use client';
import './index.css';
import * as React from 'react';
import { OTPField } from '@base-ui/react/otp-field';
import { useInvalidFeedback } from '../useInvalidFeedback';

const CODE_LENGTH = 6;

function normalizeRecoveryCode(value: string) {
  return value.toUpperCase();
}

function getInvalidClassName(invalidPulse: number, evenClassName: string, oddClassName: string) {
  if (invalidPulse === 0) {
    return '';
  }

  return invalidPulse % 2 === 0 ? evenClassName : oddClassName;
}

export default function OTPFieldCustomNormalizeDemo() {
  const id = React.useId();
  const descriptionId = `${id}-description`;

  const {
    activeInvalidIndex,
    handleValueChange,
    handleValueInvalid,
    invalidPulse,
    setFocusedIndex,
    statusMessage,
  } = useInvalidFeedback();

  const invalidClassName = getInvalidClassName(
    invalidPulse,
    'border-red-700 outline-2 -outline-offset-1 outline-red-700 dark:border-red-400 dark:outline-red-400 focus:outline-red-700 dark:focus:outline-red-400 animate-[otp-field-shake-b_180ms_ease-in-out]',
    'border-red-700 outline-2 -outline-offset-1 outline-red-700 dark:border-red-400 dark:outline-red-400 focus:outline-red-700 dark:focus:outline-red-400 animate-[otp-field-shake-a_180ms_ease-in-out]',
  );

  return (
    <div className="flex w-full max-w-80 flex-col items-start gap-1">
      <label htmlFor={id} className="text-sm font-bold text-neutral-950 dark:text-white">
        Recovery code
      </label>
      <OTPField.Root
        id={id}
        length={CODE_LENGTH}
        validationType="alphanumeric"
        normalizeValue={normalizeRecoveryCode}
        onValueChange={handleValueChange}
        onValueInvalid={handleValueInvalid}
        aria-describedby={descriptionId}
        className="flex w-full gap-2"
      >
        {Array.from({ length: CODE_LENGTH }, (_, index) => (
          <OTPField.Input
            key={index}
            className={`box-border m-0 size-10 rounded-none border bg-white p-0 font-[inherit] text-base font-normal text-center text-neutral-950 dark:bg-neutral-950 dark:text-white focus:outline-2 focus:-outline-offset-1 ${activeInvalidIndex === index ? invalidClassName : 'border-neutral-950 dark:border-white focus:outline-neutral-950 dark:focus:outline-white'}`.trim()}
            aria-label={index === 0 ? undefined : `Character ${index + 1} of ${CODE_LENGTH}`}
            onFocus={() => {
              setFocusedIndex(index);
            }}
          />
        ))}
      </OTPField.Root>
      <p id={descriptionId} className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
        Letters and digits only. Letters are converted to uppercase.
      </p>
      <span aria-live="polite" className="sr-only">
        {statusMessage}
      </span>
    </div>
  );
}
