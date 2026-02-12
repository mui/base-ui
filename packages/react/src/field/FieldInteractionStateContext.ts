'use client';
import * as React from 'react';
import { NOOP } from '../utils/noop';

export interface FieldInteractionStateContext {
  touched: boolean;
  setTouched: React.Dispatch<React.SetStateAction<boolean>>;
  dirty: boolean;
  setDirty: React.Dispatch<React.SetStateAction<boolean>>;
  filled: boolean;
  setFilled: React.Dispatch<React.SetStateAction<boolean>>;
  focused: boolean;
  setFocused: React.Dispatch<React.SetStateAction<boolean>>;
  state: {
    touched: boolean;
    dirty: boolean;
    filled: boolean;
    focused: boolean;
  };
  markedDirtyRef: React.RefObject<boolean>;
}

export const FieldInteractionStateContext = React.createContext<FieldInteractionStateContext>({
  touched: false,
  setTouched: NOOP,
  dirty: false,
  setDirty: NOOP,
  filled: false,
  setFilled: NOOP,
  focused: false,
  setFocused: NOOP,
  state: {
    touched: false,
    dirty: false,
    filled: false,
    focused: false,
  },
  markedDirtyRef: { current: false },
});

export function useFieldInteractionStateContext(optional = true) {
  const context = React.useContext(FieldInteractionStateContext);

  if (context.setFocused === NOOP && !optional) {
    throw new Error(
      'Base UI: FieldInteractionStateContext is missing. Field parts must be placed within <Field.Root>.',
    );
  }

  return context;
}
