import * as React from 'react';
import { TemporalFieldStore } from '../../utils/temporal/field/TemporalFieldStore';
import { TemporalValue } from '../../types';
import {
  ValidateTimeReturnValue,
  ValidateTimeValidationProps,
} from '../../utils/temporal/validateTime';

export type TimeFieldRootContext = TemporalFieldStore<
  TemporalValue,
  ValidateTimeReturnValue,
  ValidateTimeValidationProps
>;

export const TimeFieldRootContext = React.createContext<TimeFieldRootContext | undefined>(
  undefined,
);

export function useTimeFieldRootContext() {
  const context = React.useContext(TimeFieldRootContext);
  if (context === undefined) {
    throw new Error(
      [
        'Base UI: TimeFieldRootContext is missing.',
        'Time Field parts must be placed within <TimeField.Root />.',
      ].join('\n'),
    );
  }
  return context;
}
