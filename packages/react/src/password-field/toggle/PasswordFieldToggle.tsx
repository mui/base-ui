'use client';
import * as React from 'react';
import { useButton } from '../../internals/use-button/useButton';
import { useRenderElement } from '../../internals/useRenderElement';
import type { BaseUIComponentProps, NativeButtonProps } from '../../internals/types';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { usePasswordFieldRootContext } from '../root/PasswordFieldRootContext';

/**
 * A button that toggles the password's visibility.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Password Field](https://base-ui.com/react/components/password-field)
 */
export const PasswordFieldToggle = React.forwardRef(function PasswordFieldToggle(
  componentProps: PasswordFieldToggle.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    disabled: disabledProp = false,
    nativeButton = true,
    type, // cannot change the button type; the toggle must never submit a form
    render,
    className,
    style,
    ...elementProps
  } = componentProps;

  const { visible, setVisible, disabled: rootDisabled, inputId } = usePasswordFieldRootContext();

  const disabled = rootDisabled || disabledProp;

  const { getButtonProps, buttonRef } = useButton({ disabled, native: nativeButton });

  const state: PasswordFieldToggle.State = { pressed: visible, disabled };

  const element = useRenderElement('button', componentProps, {
    state,
    ref: [forwardedRef, buttonRef],
    props: [
      {
        // A toggle button: `aria-pressed` is announced reliably on change, unlike a swapped
        // `aria-label` (which VoiceOver in particular often fails to re-announce).
        'aria-pressed': visible,
        'aria-controls': inputId,
        // Keep focus (and the caret) on the input when the toggle is clicked with a pointer
        // instead of moving it to the button, so the user can keep typing. Keyboard activation
        // has no `mousedown`, so it still focuses the toggle.
        onMouseDown(event) {
          event.preventDefault();
        },
        onClick(event) {
          setVisible(!visible, createChangeEventDetails(REASONS.none, event.nativeEvent));
        },
      },
      elementProps,
      getButtonProps,
    ],
  });

  return element;
});

export interface PasswordFieldToggleState {
  /**
   * Whether the toggle is pressed (the password is revealed as plain text).
   */
  pressed: boolean;
  /**
   * Whether the toggle should ignore user interaction.
   */
  disabled: boolean;
}

export interface PasswordFieldToggleProps
  extends NativeButtonProps, BaseUIComponentProps<'button', PasswordFieldToggleState> {}

export namespace PasswordFieldToggle {
  export type State = PasswordFieldToggleState;
  export type Props = PasswordFieldToggleProps;
}
