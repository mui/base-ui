import type { BaseUIComponentProps } from '../../utils/types';

export type FieldLabelOwnerState = {
  disabled: boolean;
  touched: boolean;
  dirty: boolean;
  valid: boolean;
};

export interface FieldLabelProps extends BaseUIComponentProps<'div', FieldLabelOwnerState> {}
