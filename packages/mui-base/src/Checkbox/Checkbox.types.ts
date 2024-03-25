import type { BaseUiComponentCommonProps } from '../utils/BaseUiComponentCommonProps';
import { UseCheckboxParameters } from '../useCheckbox';

export type CheckboxOwnerState = {
  checked: boolean;
  disabled: boolean;
  readOnly: boolean;
  required: boolean;
  indeterminate: boolean;
};

export interface CheckboxProps
  extends UseCheckboxParameters,
    Omit<BaseUiComponentCommonProps<'button', CheckboxOwnerState>, 'onChange'> {}

export interface CheckboxIndicatorProps
  extends BaseUiComponentCommonProps<'span', CheckboxOwnerState> {
  /**
   * If `true`, the indicator stays mounted when unchecked. Useful for CSS animations.
   *
   * @default false
   */
  keepMounted?: boolean;
}
