import * as React from 'react';
import type { BaseUiComponentCommonProps } from '../utils/BaseUiComponentCommonProps';

export type CheckboxOwnerState = {
  checked: boolean;
  disabled: boolean;
  readOnly: boolean;
  required: boolean;
  indeterminate: boolean;
};

export interface CheckboxProps
  extends Omit<BaseUiComponentCommonProps<'button', CheckboxOwnerState>, 'onChange'> {
  /**
   * Name of the underlying input element.
   *
   * @default undefined
   */
  name?: string;
  /**
   * If `true`, the component is checked.
   *
   * @default undefined
   */
  checked?: boolean;
  /**
   * The default checked state. Use when the component is not controlled.
   *
   * @default false
   */
  defaultChecked?: boolean;
  /**
   * If `true`, the component is disabled.
   *
   * @default false
   */
  disabled?: boolean;
  /**
   * Callback fired when the state is changed.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} event The event source of the callback.
   * You can pull out the new value by accessing `event.target.value` (string).
   * You can pull out the new checked state by accessing `event.target.checked` (boolean).
   */
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  /**
   * If `true`, the component is read only.
   *
   * @default false
   */
  readOnly?: boolean;
  /**
   * If `true`, the `input` element is required.
   *
   * @default false
   */
  required?: boolean;
  /**
   * If `true`, the checkbox is focused on mount.
   *
   * @default false
   */
  autoFocus?: boolean;
  /**
   * If `true`, the checkbox will be indeterminate.
   *
   * @default false
   */
  indeterminate?: boolean;
}

export interface CheckboxIndicatorProps
  extends BaseUiComponentCommonProps<'span', CheckboxOwnerState> {
  /**
   * If `true`, the indicator stays mounted when unchecked. Useful for CSS animations.
   *
   * @default false
   */
  keepMounted?: boolean;
}
