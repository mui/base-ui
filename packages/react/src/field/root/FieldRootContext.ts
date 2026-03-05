'use client';
import * as React from 'react';
import { NOOP } from '../../utils/noop';
import {
  DEFAULT_FIELD_ROOT_STATE,
  DEFAULT_FIELD_STATE_ATTRIBUTES,
  DEFAULT_VALIDITY_STATE,
} from '../utils/constants';
import type { FieldRoot, FieldValidityData } from './FieldRoot';
import type { Form } from '../../form';
import type { UseFieldValidationReturnValue } from './useFieldValidation';
import type { HTMLProps } from '../../utils/types';
import { EMPTY_OBJECT } from '../../utils/constants';

export interface FieldRootContext {
  invalid: boolean | undefined;
  name: string | undefined;
  validityData: FieldValidityData;
  setValidityData: React.Dispatch<React.SetStateAction<FieldValidityData>>;
  disabled: boolean | undefined;
  touched: boolean;
  setTouched: React.Dispatch<React.SetStateAction<boolean>>;
  dirty: boolean;
  setDirty: React.Dispatch<React.SetStateAction<boolean>>;
  filled: boolean;
  setFilled: React.Dispatch<React.SetStateAction<boolean>>;
  focused: boolean;
  setFocused: React.Dispatch<React.SetStateAction<boolean>>;
  validate: (
    value: unknown,
    formValues: Record<string, unknown>,
  ) => string | string[] | null | Promise<string | string[] | null>;
  validationMode: Form.ValidationMode;
  validationDebounceTime: number;
  shouldValidateOnChange: () => boolean;
  state: FieldRoot.State;
  markedDirtyRef: React.RefObject<boolean>;
  validation: UseFieldValidationReturnValue;
}

export const FieldRootContext = React.createContext<FieldRootContext>({
  invalid: undefined,
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
  touched: DEFAULT_FIELD_STATE_ATTRIBUTES.touched,
  setTouched: NOOP,
  dirty: DEFAULT_FIELD_STATE_ATTRIBUTES.dirty,
  setDirty: NOOP,
  filled: DEFAULT_FIELD_STATE_ATTRIBUTES.filled,
  setFilled: NOOP,
  focused: DEFAULT_FIELD_STATE_ATTRIBUTES.focused,
  setFocused: NOOP,
  validate: () => null,
  validationMode: 'onSubmit',
  validationDebounceTime: 0,
  shouldValidateOnChange: () => false,
  state: DEFAULT_FIELD_ROOT_STATE,
  markedDirtyRef: { current: false },
  validation: {
    getValidationProps: (props: HTMLProps = EMPTY_OBJECT) => props,
    getInputValidationProps: (props: HTMLProps = EMPTY_OBJECT) => props,
    inputRef: { current: null },
    commit: async () => {},
  },
});

export function useFieldRootContext(optional = true) {
  const context = React.useContext(FieldRootContext);

  if (context.setValidityData === NOOP && !optional) {
    throw new Error(
      'Base UI: FieldRootContext is missing. Field parts must be placed within <Field.Root>.',
    );
  }

  return context;
}
