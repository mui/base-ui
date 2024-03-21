import * as React from 'react';

export interface UseSwitchParameters {
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
   */
  disabled?: boolean;
  /**
   * Ref to the underlying input element.
   */
  inputRef?: React.Ref<HTMLInputElement>;
  /**
   * Name of the underlying input element.
   */
  name?: string;
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
   */
  readOnly?: boolean;
  /**
   * If `true`, the `input` element is required.
   */
  required?: boolean;
}

interface UseSwitchInputElementOwnProps {
  checked: boolean;
  disabled?: boolean;
  name?: string;
  required?: boolean;
  style: React.CSSProperties;
  type: 'checkbox';
  'aria-hidden': React.AriaAttributes['aria-hidden'];
  ref: React.RefCallback<HTMLInputElement> | null;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
}

export type UseSwitchInputElementProps<TOther = {}> = Omit<
  TOther,
  keyof UseSwitchInputElementOwnProps
> &
  UseSwitchInputElementOwnProps;

interface UseSwitchButtonElementOwnProps {
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  type: React.ButtonHTMLAttributes<HTMLButtonElement>['type'];
  role: React.AriaRole;
  'aria-disabled': React.AriaAttributes['aria-disabled'];
  'aria-checked': React.AriaAttributes['aria-checked'];
  'aria-readonly': React.AriaAttributes['aria-readonly'];
}

export type UseSwitchButtonElementProps<TOther = {}> = Omit<
  TOther,
  keyof UseSwitchButtonElementOwnProps
> &
  UseSwitchButtonElementOwnProps;

export interface UseSwitchReturnValue {
  /**
   * If `true`, the component will be checked.
   */
  checked: boolean;
  /**
   * Resolver for the input element's props.
   * @param externalProps Additional props for the input element
   * @returns Props that should be spread on the input element
   */
  getInputProps: (
    externalProps?: React.HTMLAttributes<HTMLInputElement>,
  ) => UseSwitchInputElementProps;
  /**
   * Resolver for the button element's props.
   * @param externalProps Additional props for the input element
   * @returns Props that should be spread on the button element
   */
  getButtonProps: (
    externalProps?: React.HTMLAttributes<HTMLButtonElement>,
  ) => UseSwitchButtonElementProps;
}
