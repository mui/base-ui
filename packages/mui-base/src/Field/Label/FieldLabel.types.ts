import type { BaseUIComponentProps } from '../../utils/types';

export type FieldLabelOwnerState = {
  disabled: boolean;
  valid: boolean | null;
};

export interface FieldLabelProps extends BaseUIComponentProps<'div', FieldLabelOwnerState> {}
