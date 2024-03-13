import * as React from 'react';
import { BaseUiComponentCommonProps } from '../utils/BaseUiComponentCommonProps';

export type SwitchOwnerState = {
  checked: boolean;
  disabled: boolean;
  readOnly: boolean;
  required: boolean;
};

export interface SwitchProps
  extends Omit<BaseUiComponentCommonProps<'button', SwitchOwnerState>, 'onChange'> {
  /**
   * If `true`, the component is checked.
   */
  checked?: boolean;
  /**
   * The default checked state. Use when the component is not controlled.
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
}

export interface SwitchThumbProps extends BaseUiComponentCommonProps<'span', SwitchOwnerState> {}
