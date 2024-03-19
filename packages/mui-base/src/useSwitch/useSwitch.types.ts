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

interface UseSwitchInputSlotOwnProps {
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

export type UseSwitchInputSlotProps<TOther = {}> = Omit<TOther, keyof UseSwitchInputSlotOwnProps> &
  UseSwitchInputSlotOwnProps;

interface UseSwitchButtonSlotOwnProps {
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  type: React.ButtonHTMLAttributes<HTMLButtonElement>['type'];
  role: React.AriaRole;
  'aria-disabled': React.AriaAttributes['aria-disabled'];
  'aria-checked': React.AriaAttributes['aria-checked'];
  'aria-readonly': React.AriaAttributes['aria-readonly'];
}

export type UseSwitchButtonSlotProps<TOther = {}> = Omit<
  TOther,
  keyof UseSwitchButtonSlotOwnProps
> &
  UseSwitchButtonSlotOwnProps;

export interface UseSwitchReturnValue {
  /**
   * If `true`, the component will be checked.
   */
  checked: boolean;
  /**
   * Resolver for the input slot's props.
   * @param externalProps props for the input slot
   * @returns props that should be spread on the input slot
   */
  getInputProps: (
    externalProps?: React.HTMLAttributes<HTMLInputElement>,
  ) => UseSwitchInputSlotProps;
  getButtonProps: (
    externalProps?: React.HTMLAttributes<HTMLButtonElement>,
  ) => UseSwitchButtonSlotProps;
}
