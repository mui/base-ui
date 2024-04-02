import type { BaseUIComponentProps } from '../utils/BaseUI.types';
import type { UseCheckboxParameters } from '../useCheckbox';

export type CheckboxOwnerState = {
  checked: boolean;
  disabled: boolean;
  readOnly: boolean;
  required: boolean;
  indeterminate: boolean;
};

export interface CheckboxProps
  extends UseCheckboxParameters,
    Omit<BaseUIComponentProps<'button', CheckboxOwnerState>, 'onChange'> {}

export interface CheckboxIndicatorProps extends BaseUIComponentProps<'span', CheckboxOwnerState> {
  /**
   * If `true`, the indicator stays mounted when unchecked. Useful for CSS animations.
   * @default false
   */
  keepMounted?: boolean;
}
