import type { BaseUIComponentProps } from '../../utils/types';

export type FieldsetRootOwnerState = {
  disabled: boolean;
};

export interface FieldsetRootProps
  extends BaseUIComponentProps<'fieldset', FieldsetRootOwnerState> {}
