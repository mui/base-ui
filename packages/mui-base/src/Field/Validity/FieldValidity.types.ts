import type * as React from 'react';
import type { FieldValidityData } from '../Root/FieldRoot.types';

export interface FieldValidityState extends Omit<FieldValidityData, 'state'> {
  validity: FieldValidityData['state'];
}

export interface FieldValidityOwnerState {}

export interface FieldValidityProps {
  children: (state: FieldValidityState) => React.ReactNode;
}
