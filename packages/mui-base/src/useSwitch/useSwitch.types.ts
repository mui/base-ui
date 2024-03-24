import * as React from 'react';

export interface UseSwitchParameters {
  /**
   * If `true`, the switch is checked.
   */
  checked?: boolean;
  /**
   * The default checked state. Use when the component is not controlled.
   */
  defaultChecked?: boolean;
  /**
   * If `true`, the component is disabled and can't be interacted with.
   *
   * @default false
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
   * If `true`, the component is read-only.
   * Functionally, this is equivalent to being disabled, but the assistive technologies will announce this differently.
   *
   * @default false
   */
  readOnly?: boolean;
  /**
   * If `true`, the switch must be checked for the browser validation to pass.
   *
   * @default false
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

/**
 * Props that are received by the input element of the Switch.
 */
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

/**
 * Props that are received by the button element of the Switch.
 */
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
    externalProps?: React.ComponentPropsWithRef<'input'>,
  ) => React.ComponentPropsWithRef<'input'>;
  /**
   * Resolver for the button element's props.
   * @param externalProps Additional props for the input element
   * @returns Props that should be spread on the button element
   */
  getButtonProps: (
    externalProps?: React.ComponentPropsWithRef<'button'>,
  ) => React.ComponentPropsWithRef<'button'>;
}
