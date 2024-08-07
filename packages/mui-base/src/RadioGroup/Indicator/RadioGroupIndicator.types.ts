import type { BaseUIComponentProps } from '../../utils/types';

export type RadioGroupIndicatorOwnerState = {
  disabled: boolean;
  checked: boolean;
};

export interface RadioGroupIndicatorProps
  extends BaseUIComponentProps<'span', RadioGroupIndicatorOwnerState> {}
