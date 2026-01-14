import * as React from 'react';
import { TemporalFieldStore } from '../../utils/temporal/field/TemporalFieldStore';
import { TemporalValue } from '../../types';
import {
  ValidateDateReturnValue,
  ValidateDateValidationProps,
} from '../../utils/temporal/validateDate';

export type DateFieldRootContext = TemporalFieldStore<
  TemporalValue,
  ValidateDateReturnValue,
  ValidateDateValidationProps
>;

export const DateFieldRootContext = React.createContext<DateFieldRootContext | undefined>(
  undefined,
);

export function useDateFieldRootContext() {
  const context = React.useContext(DateFieldRootContext);
  if (context === undefined) {
    throw new Error(
      [
        'Base UI: DateFieldRootContext is missing.',
        'Date Field parts must be placed within <DateField.Root />.',
      ].join('\n'),
    );
  }
  return context;
}
