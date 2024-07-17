import type { BaseUIComponentProps } from '../../utils/types';

export type FieldLabelOwnerState = {
  disabled: boolean;
};

export interface FieldLabelProps extends BaseUIComponentProps<'div', FieldLabelOwnerState> {}
