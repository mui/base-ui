'use client';
import * as React from 'react';
import type { OTPFieldRoot, OTPFieldRootState } from './OTPFieldRoot';
import type { OTPFieldInputState } from '../input/OTPFieldInput';

export interface OTPFieldRootContext {
  activeIndex: number;
  ariaLabelledBy: string | undefined;
  autoComplete: string | undefined;
  disabled: boolean;
  focusInput: (index: number) => void;
  queueFocusInput: (index: number) => void;
  getInputId: (index: number) => string | undefined;
  handleInputBlur: (event: React.FocusEvent<HTMLInputElement>) => void;
  handleInputFocus: (index: number, event: React.FocusEvent<HTMLInputElement>) => void;
  id: string | undefined;
  invalid: boolean | undefined;
  length: number;
  readOnly: boolean;
  required: boolean;
  setValue: (value: string, details: OTPFieldRoot.ChangeEventDetails) => void;
  state: OTPFieldRootState;
  value: string;
}

export const OTPFieldRootContext = React.createContext<OTPFieldRootContext | undefined>(undefined);

export function useOTPFieldRootContext() {
  const context = React.useContext(OTPFieldRootContext);

  if (context === undefined) {
    throw new Error(
      'Base UI: OTPFieldRootContext is missing. OTPField parts must be placed within <OTPField.Root>.',
    );
  }

  return context;
}

export function getOTPFieldInputState(
  state: OTPFieldRootState,
  value: string,
  index: number,
): OTPFieldInputState {
  return {
    ...state,
    value,
    index,
    filled: value !== '',
  };
}
