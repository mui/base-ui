'use client';
import * as React from 'react';
import { DEFAULT_VALIDITY_STATE } from '../utils/constants';
import type { FieldRoot, FieldValidityData } from './FieldRoot';

const NOOP = () => {};

export interface FieldRootContext {
  invalid: boolean | undefined;
  controlId: string | undefined;
  setControlId: React.Dispatch<React.SetStateAction<string | undefined>>;
  labelId: string | undefined;
  setLabelId: React.Dispatch<React.SetStateAction<string | undefined>>;
  messageIds: string[];
  setMessageIds: React.Dispatch<React.SetStateAction<string[]>>;
  name: string | undefined;
  validityData: FieldValidityData;
  setValidityData: React.Dispatch<React.SetStateAction<FieldValidityData>>;
  disabled: boolean | undefined;
  touched: boolean;
  setTouched: React.Dispatch<React.SetStateAction<boolean>>;
  dirty: boolean;
  setDirty: React.Dispatch<React.SetStateAction<boolean>>;
  validate: (value: unknown) => string | string[] | null | Promise<string | string[] | null>;
  validationMode: 'onBlur' | 'onChange';
  validationDebounceTime: number;
  ownerState: FieldRoot.OwnerState;
  markedDirtyRef: React.MutableRefObject<boolean>;
}

export const FieldRootContext = React.createContext<FieldRootContext>({
  invalid: undefined,
  controlId: undefined,
  setControlId: NOOP,
  labelId: undefined,
  setLabelId: NOOP,
  messageIds: [],
  setMessageIds: NOOP,
  name: undefined,
  validityData: {
    state: DEFAULT_VALIDITY_STATE,
    errors: [],
    error: '',
    value: '',
    initialValue: null,
  },
  setValidityData: NOOP,
  disabled: undefined,
  touched: false,
  setTouched: NOOP,
  dirty: false,
  setDirty: NOOP,
  validate: () => null,
  validationMode: 'onBlur',
  validationDebounceTime: 0,
  ownerState: {
    disabled: false,
    valid: null,
    touched: false,
    dirty: false,
  },
  markedDirtyRef: { current: false },
});

if (process.env.NODE_ENV !== 'production') {
  FieldRootContext.displayName = 'FieldRootContext';
}

export function useFieldRootContext(optional = true) {
  const context = React.useContext(FieldRootContext);

  if (context.setControlId === NOOP && !optional) {
    throw new Error('Base UI: Field components must be placed within <Field.Root>.');
  }

  return context;
}
