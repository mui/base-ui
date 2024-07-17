import type * as React from 'react';

export interface FieldValidityParameters {
  validity: ValidityState;
  value: unknown;
}

export type FieldValidityOwnerState = {
  disabled: boolean;
};

export interface FieldValidityProps {
  children: (
    params: FieldValidityParameters,
    ownerState: FieldValidityOwnerState,
  ) => React.ReactNode;
}
