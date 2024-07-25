import type { BaseUIComponentProps } from '../../utils/types';

export type FieldLabelOwnerState = {
  disabled: boolean;
  valid: boolean;
};

export interface FieldLabelProps extends BaseUIComponentProps<'div', FieldLabelOwnerState> {}
