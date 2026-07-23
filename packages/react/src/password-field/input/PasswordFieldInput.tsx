'use client';
import * as React from 'react';
import { addEventListener } from '@base-ui/utils/addEventListener';
import { mergeCleanups } from '@base-ui/utils/mergeCleanups';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { useRegisteredLabelId } from '../../utils/useRegisteredLabelId';
import type { BaseUIComponentProps } from '../../internals/types';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { Field, type FieldControlState } from '../../field';
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
  const { id: idProp, disabled: disabledProp = false, ...elementProps } = componentProps;

  const { visible, setVisible, disabled: rootDisabled, setInputId } = usePasswordFieldRootContext();

  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const mergedRef = useMergedRefs(forwardedRef, inputRef);
  const resetTimeout = useTimeout();

  // Resolve (or generate) the input id and register it so the toggle's `aria-controls`
  // tracks it (with cleanup on unmount). Field uses the same id to wire up `Field.Label`.
  const id = useRegisteredLabelId(idProp, setInputId);

  // Hide the password again when the owning form is reset or submitted. Field handles the
  // value reset; the visibility reset is ours.
  useIsoLayoutEffect(() => {
    const form = inputRef.current?.form;
    if (!form) {
      return undefined;
    }

    // A reset can be canceled by a handler; a submit always hides so a revealed password
    // never persists after a submission attempt.
    return mergeCleanups(
      addEventListener(form, 'reset', (event) => {
        resetTimeout.start(0, () => {
          if (!event.defaultPrevented) {
            setVisible(false, createChangeEventDetails(REASONS.none, event));
          }
        });
      }),
      addEventListener(form, 'submit', (event) => {
        resetTimeout.clear();
        setVisible(false, createChangeEventDetails(REASONS.none, event));
      }),
    );
  }, [inputRef, resetTimeout, setVisible]);

  return (
    <Field.Control
      // Password-friendly defaults; consumer props below override them.
      autoComplete="current-password"
      autoCapitalize="off"
      autoCorrect="off"
      spellCheck={false}
      {...elementProps}
      ref={mergedRef}
      id={id}
      disabled={rootDisabled || disabledProp}
      // `type` derives from visibility and must win over any consumer-supplied `type`,
      // otherwise the toggle would silently stop switching the field.
      type={visible ? 'text' : 'password'}
    />
  );
});

export interface PasswordFieldInputState extends FieldControlState {}

export interface PasswordFieldInputProps extends BaseUIComponentProps<
  'input',
  PasswordFieldInputState
> {
  /**
   * Callback fired when the `value` changes. Use when controlled.
   */
  onValueChange?:
    | ((value: string, eventDetails: PasswordFieldInput.ChangeEventDetails) => void)
    | undefined;
  /**
   * The default value of the input. Use when uncontrolled.
   */
  defaultValue?: Field.Control.Props['defaultValue'] | undefined;
  /**
   * The value of the input. Use when controlled.
   */
  value?: React.ComponentProps<'input'>['value'] | undefined;
}

export type PasswordFieldInputChangeEventReason = Field.Control.ChangeEventReason;
export type PasswordFieldInputChangeEventDetails = Field.Control.ChangeEventDetails;

export namespace PasswordFieldInput {
  export type State = PasswordFieldInputState;
  export type Props = PasswordFieldInputProps;
  export type ChangeEventReason = PasswordFieldInputChangeEventReason;
  export type ChangeEventDetails = PasswordFieldInputChangeEventDetails;
}
