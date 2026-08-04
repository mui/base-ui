'use client';
import * as React from 'react';
import type { NumberFieldRoot, NumberFieldRootState } from './NumberFieldRoot';
import type {
  EventWithOptionalKeyState,
  IncrementValueParameters,
  SetValueOptions,
  TextSource,
} from '../utils/types';

export type InputMode = 'numeric' | 'decimal' | 'text';

export interface NumberFieldRootContext {
  minWithDefault: number;
  maxWithDefault: number;
  id: string | undefined;
  setValue: (
    value: number | null,
    details: NumberFieldRoot.ChangeEventDetails,
    options?: SetValueOptions,
  ) => boolean;
  getStepAmount: (event?: EventWithOptionalKeyState) => number;
  incrementValue: (amount: number, params: IncrementValueParameters) => boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  /**
   * Whether the text in the input was authored by the user rather than derived from `value`.
   * Read-only: authorship changes only as a side effect of `setInputValue` landing a write.
   */
  isTextUserAuthored: () => boolean;
  formatOptionsRef: React.RefObject<Intl.NumberFormatOptions | undefined>;
  valueRef: React.RefObject<number | null>;
  lastChangedValueRef: React.RefObject<number | null>;
  hasPendingCommitRef: React.RefObject<boolean>;
  name: string | undefined;
  nameProp: string | undefined;
  inputMode: InputMode;
  getAllowedNonNumericKeys: () => Set<string>;
  min: number | undefined;
  max: number | undefined;
  setInputValue: (
    value: string,
    details: NumberFieldRoot.ChangeEventDetails,
    source: TextSource,
  ) => void;
  locale: Intl.LocalesArgument;
  setIsScrubbing: React.Dispatch<React.SetStateAction<boolean>>;
  state: NumberFieldRootState;
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
