import type * as React from 'react';

export interface FieldValidityParameters {
  validity: ValidityState;
  value: unknown;
}

export type FieldValidityOwnerState = {};

export interface FieldValidityProps {
  children: (validity: ValidityState, value: unknown) => React.ReactNode;
}
