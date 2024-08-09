import type { BaseUIComponentProps } from '../../utils/types';

export type FieldsetLegendOwnerState = {
  disabled: boolean;
};

export interface FieldsetLegendProps
  extends BaseUIComponentProps<'span', FieldsetLegendOwnerState> {}
