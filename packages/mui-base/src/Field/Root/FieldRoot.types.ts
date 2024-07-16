import type { BaseUIComponentProps } from '../../utils/types';

export interface ValidityData {
  validityState: ValidityState;
  validityMessage: string;
  value: unknown;
}

export type FieldRootOwnerState = {};

export interface FieldRootProps extends BaseUIComponentProps<'div', FieldRootOwnerState> {}
