import type { BaseUIComponentProps } from '../../utils/types';

export interface ValidityData {
  validityState: ValidityState;
  validityMessage: string;
  value: unknown;
}

export type FieldRootOwnerState = {
  disabled: boolean;
  valid: boolean;
};

export interface FieldRootProps extends BaseUIComponentProps<'div', FieldRootOwnerState> {
  /**
   * Whether the field is disabled, adding a disabled style hook to all subcomponents as well as
   * disabling the interactive control inside.
   * @default false
   */
  disabled?: boolean;
}
