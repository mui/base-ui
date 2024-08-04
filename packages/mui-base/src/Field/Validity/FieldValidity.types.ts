import type * as React from 'react';

export interface FieldValidityState {
  validity: Omit<ValidityState, 'valid'> & { valid: boolean | null };
  errors: string[];
  error: string;
  value: unknown;
}

export type FieldValidityOwnerState = {};

export interface FieldValidityProps {
  children: (state: FieldValidityState) => React.ReactNode;
}
