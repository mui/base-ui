import type * as React from 'react';

export interface FieldValidityState {
  validity: ValidityState;
  errors: string[];
  error: string;
  value: unknown;
}

export type FieldValidityOwnerState = {};

export interface FieldValidityProps {
  children: (state: FieldValidityState) => React.ReactNode;
}
