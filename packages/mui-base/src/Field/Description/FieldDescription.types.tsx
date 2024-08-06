import type { BaseUIComponentProps } from '../../utils/types';

export type FieldDescriptionOwnerState = {
  disabled: boolean;
  touched: boolean;
  dirty: boolean;
  valid: boolean;
};

export interface FieldDescriptionProps
  extends BaseUIComponentProps<'p', FieldDescriptionOwnerState> {}
