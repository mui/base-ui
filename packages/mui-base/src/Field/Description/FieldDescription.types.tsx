import type { BaseUIComponentProps } from '../../utils/types';

export type FieldDescriptionOwnerState = {
  disabled: boolean;
  valid: boolean | null;
};

export interface FieldDescriptionProps
  extends BaseUIComponentProps<'p', FieldDescriptionOwnerState> {}
