'use client';
import * as React from 'react';
import { Timeout } from '@base-ui/utils/useTimeout';
import type { NumberFieldRoot } from './NumberFieldRoot';
import { EventWithOptionalKeyState } from '../utils/types';
import type { IncrementValueParameters } from '../utils/types';

export type InputMode = 'numeric' | 'decimal' | 'text';

export interface NumberFieldRootContext {
  inputValue: string;
  value: number | null;
  startAutoChange: (isIncrement: boolean, event?: React.MouseEvent | Event) => void;
  stopAutoChange: () => void;
  minWithDefault: number;
  maxWithDefault: number;
  disabled: boolean;
  readOnly: boolean;
  id: string | undefined;
  setValue: (value: number | null, details: NumberFieldRoot.ChangeEventDetails) => void;
  getStepAmount: (event?: EventWithOptionalKeyState) => number | undefined;
  incrementValue: (amount: number, params: IncrementValueParameters) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  allowInputSyncRef: React.RefObject<boolean | null>;
  formatOptionsRef: React.RefObject<Intl.NumberFormatOptions | undefined>;
  valueRef: React.RefObject<number | null>;
  lastChangedValueRef: React.RefObject<number | null>;
  hasPendingCommitRef: React.RefObject<boolean>;
  isPressedRef: React.RefObject<boolean | null>;
  intentionalTouchCheckTimeout: Timeout;
  movesAfterTouchRef: React.RefObject<number | null>;
  name: string | undefined;
  required: boolean;
  invalid: boolean | undefined;
  inputMode: InputMode;
  getAllowedNonNumericKeys: () => Set<string | undefined>;
  min: number | undefined;
  max: number | undefined;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  locale: Intl.LocalesArgument;
  isScrubbing: boolean;
  setIsScrubbing: React.Dispatch<React.SetStateAction<boolean>>;
  state: NumberFieldRoot.State;
  onValueCommitted: (
    value: number | null,
    eventDetails: NumberFieldRoot.CommitEventDetails,
  ) => void;
}

export const NumberFieldRootContext = React.createContext<NumberFieldRootContext | undefined>(
  undefined,
);

export function useNumberFieldRootContext() {
  const context = React.useContext(NumberFieldRootContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: NumberFieldRootContext is missing. NumberField parts must be placed within <NumberField.Root>.',
    );
  }

  return context;
}
