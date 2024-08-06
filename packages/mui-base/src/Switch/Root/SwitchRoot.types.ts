import type * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import type { FieldRootOwnerState } from '../../Field/Root/FieldRoot.types';

export interface SwitchOwnerState extends FieldRootOwnerState {
  checked: boolean;
  disabled: boolean;
  readOnly: boolean;
  required: boolean;
}

export interface SwitchRootProps
  extends UseSwitchRootParameters,
    Omit<BaseUIComponentProps<'button', SwitchOwnerState>, 'onChange'> {}

export type SwitchContextValue = SwitchOwnerState;

export interface UseSwitchRootParameters {
  /**
   * The id of the switch element.
   */
  id?: string;
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
   * Callback fired when the checked state is changed.
   *
   * @param {boolean} checked The new checked state.
   * @param {React.ChangeEvent<HTMLInputElement>} event The event source of the callback.
   */
  onCheckedChange?: (checked: boolean, event: React.ChangeEvent<HTMLInputElement>) => void;
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
export interface UseSwitchRootReturnValue {
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
