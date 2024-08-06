import type { BaseUIComponentProps } from '../../utils/types';

export type FieldErrorOwnerState = {
  disabled: boolean;
  touched: boolean;
  dirty: boolean;
  valid: boolean;
};

export interface FieldErrorProps extends BaseUIComponentProps<'span', FieldErrorOwnerState> {
  show?: keyof ValidityState;
}
