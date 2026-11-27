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
 * Label it with text children or `aria-label`.
 * Its pressed state is announced to screen readers, so don't change the label when it's pressed.
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
    render,
    className,
    style,
    ...elementProps
  } = componentProps;

  const {
    state: { revealed, disabled: rootDisabled },
    setRevealed,
    inputId,
    inputRef,
  } = usePasswordFieldRootContext();

  const disabled = rootDisabled || disabledProp;

  const { getButtonProps, buttonRef } = useButton({ disabled, native: nativeButton });

  const state: PasswordFieldToggle.State = { revealed, disabled };

  const element = useRenderElement('button', componentProps, {
    state,
    ref: [forwardedRef, buttonRef],
    props: [
      {
        // A toggle button: `aria-pressed` is announced reliably on change, unlike a swapped
        // `aria-label` (which VoiceOver in particular often fails to re-announce).
        'aria-pressed': revealed,
        'aria-controls': inputId,
        // A pointer press on the toggle keeps focus (and the caret) on a focused input, so the
        // user can keep typing. Keyboard activation has no `mousedown` and focuses the toggle.
        onMouseDown(event) {
          const input = inputRef.current;
          // The input's own root reports its focus even inside a closed shadow root, which a
          // traversal from the document can't enter.
          const root = input?.getRootNode() as Document | ShadowRoot | undefined;
          if (event.button === 0 && input && root?.activeElement === input) {
            event.preventDefault();
          }
        },
        onClick(event) {
          setRevealed(
            !revealed,
            createChangeEventDetails(REASONS.none, event.nativeEvent, event.currentTarget),
          );
        },
      },
      elementProps,
      getButtonProps,
      // `type` isn't part of the props, and a spread or untyped one is overridden too: the
      // toggle must never submit a form.
      nativeButton ? { type: 'button' } : undefined,
    ],
  });

  return element;
});

export interface PasswordFieldToggleState {
  /**
   * Whether the password is currently revealed as plain text.
   */
  revealed: boolean;
  /**
   * Whether the toggle should ignore user interaction.
   */
  disabled: boolean;
}

export interface PasswordFieldToggleProps
  extends
    NativeButtonProps,
    Omit<BaseUIComponentProps<'button', PasswordFieldToggleState>, 'type'> {
  /**
   * Whether the toggle should ignore user interaction.
   * Use the `disabled` prop on `PasswordField.Root` to disable the input as well.
   * @default false
   */
  disabled?: boolean | undefined;
}

export namespace PasswordFieldToggle {
  export type State = PasswordFieldToggleState;
  export type Props = PasswordFieldToggleProps;
}
