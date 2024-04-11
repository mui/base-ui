import * as React from 'react';

export interface UseCheckboxParameters {
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
  /**
   * The ref to the input element.
   */
  inputRef?: React.Ref<HTMLInputElement>;
}

export interface UseCheckboxReturnValue {
  /**
   * If `true`, the checkbox is checked.
   */
  checked: boolean;
  /**
   * Resolver for the input element's props.
   * @param externalProps custom props for the input element
   * @returns props that should be spread on the input element
   */
  getInputProps: (
    externalProps?: React.ComponentPropsWithRef<'input'>,
  ) => React.ComponentPropsWithRef<'input'>;
  /**
   * Resolver for the button element's props.
   * @param externalProps custom props for the button element
   * @returns props that should be spread on the button element
   */
  getButtonProps: (
    externalProps?: React.ComponentPropsWithRef<'button'>,
  ) => React.ComponentPropsWithRef<'button'>;
}
