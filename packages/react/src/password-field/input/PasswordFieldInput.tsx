'use client';
import * as React from 'react';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { Field } from '../../field';
import type {
  InputChangeEventDetails,
  InputChangeEventReason,
  InputProps,
  InputState,
} from '../../input/Input';
import { usePasswordFieldRootContext } from '../root/PasswordFieldRootContext';

/**
 * The password input. Its `type` toggles between `password` and `text`, and it works with
 * [Field](https://base-ui.com/react/components/field) for labeling and validation.
 * Renders an `<input>` element.
 *
 * Documentation: [Base UI Password Field](https://base-ui.com/react/components/password-field)
 */
export const PasswordFieldInput = React.forwardRef(function PasswordFieldInput(
  componentProps: PasswordFieldInput.Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
) {
  const { disabled: disabledProp = false, ...elementProps } = componentProps;

  const { visible, disabled: rootDisabled, inputIdProp, inputRef } = usePasswordFieldRootContext();

  const mergedRef = useMergedRefs(forwardedRef, inputRef);

  return (
    <Field.Control
      // Password-friendly defaults; consumer props below override them.
      autoComplete="current-password"
      autoCapitalize="off"
      autoCorrect="off"
      spellCheck={false}
      {...elementProps}
      ref={mergedRef}
      // The Root owns `id` and `type`, so the toggle's `aria-controls` and switching can't break.
      id={inputIdProp}
      disabled={rootDisabled || disabledProp}
      type={visible ? 'text' : 'password'}
    />
  );
});

export interface PasswordFieldInputState extends InputState {}

export interface PasswordFieldInputProps extends Omit<InputProps, 'id' | 'type'> {
  /**
   * Whether the input should ignore user interaction.
   * Use the `disabled` prop on `PasswordField.Root` to disable the toggle as well.
   * @default false
   */
  disabled?: boolean | undefined;
}

export type PasswordFieldInputChangeEventReason = InputChangeEventReason;
export type PasswordFieldInputChangeEventDetails = InputChangeEventDetails;

export namespace PasswordFieldInput {
  export type State = PasswordFieldInputState;
  export type Props = PasswordFieldInputProps;
  export type ChangeEventReason = PasswordFieldInputChangeEventReason;
  export type ChangeEventDetails = PasswordFieldInputChangeEventDetails;
}
