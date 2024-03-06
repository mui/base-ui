import * as React from 'react';
import type { CheckboxProps } from '../Checkbox';

export interface UseCheckboxParameters extends CheckboxProps {
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
