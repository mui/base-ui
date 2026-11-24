'use client';
import * as React from 'react';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { Field } from '../../field';
import { useRenderedId } from '../../internals/resolveRenderedId';
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

  const {
    visible,
    maskedForSubmit,
    disabled: rootDisabled,
    inputIdProp,
    setRenderedInputId,
    inputRef,
  } = usePasswordFieldRootContext();

  // Only the render element's id can override the Root's; a spread `id` is still ignored.
  const [id, registerIdRef] = useRenderedId(
    { render: elementProps.render },
    inputIdProp,
    setRenderedInputId,
  );

  const mergedRef = useMergedRefs(forwardedRef, inputRef, registerIdRef);

  return (
    <Field.Control
      // Password-friendly defaults; consumer props below override them.
      autoComplete="current-password"
      autoCapitalize="off"
      autoCorrect="off"
      spellCheck={false}
      {...elementProps}
      ref={mergedRef}
      // The Root owns `type` so switching can't break, and `id` resolves through the Root so the
      // toggle's `aria-controls` and a Field's label follow a render element's id.
      id={id}
      disabled={rootDisabled || disabledProp}
      type={visible && !maskedForSubmit ? 'text' : 'password'}
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
