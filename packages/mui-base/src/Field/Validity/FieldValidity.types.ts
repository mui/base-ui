import type * as React from 'react';

export interface FieldValidityProps {
  children: (validityState: ValidityState, value: unknown) => React.ReactNode;
}
