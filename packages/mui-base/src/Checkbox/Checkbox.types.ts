import type { BaseUIComponentProps } from '../utils/BaseUI.types';
import type { UseCheckboxParameters } from '../useCheckbox';

export type OwnerState = {
  checked: boolean;
  disabled: boolean;
  readOnly: boolean;
  required: boolean;
  indeterminate: boolean;
};

export interface RootProps
  extends UseCheckboxParameters,
    Omit<BaseUIComponentProps<'button', OwnerState>, 'onChange'> {}

export interface IndicatorProps extends BaseUIComponentProps<'span', OwnerState> {
  /**
   * If `true`, the indicator stays mounted when unchecked. Useful for CSS animations.
   * @default false
   */
  keepMounted?: boolean;
}
