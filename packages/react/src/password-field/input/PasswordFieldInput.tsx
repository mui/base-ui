'use client';
import * as React from 'react';
import { addEventListener } from '@base-ui/utils/addEventListener';
import { mergeCleanups } from '@base-ui/utils/mergeCleanups';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useFieldControl } from '../../field/control/useFieldControl';
import { fieldValidityMapping } from '../../internals/field-constants/constants';
import { useRenderElement } from '../../internals/useRenderElement';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { useRenderedId } from '../../internals/resolveRenderedId';
import { styleHideNativeReveal } from '../../utils/styles';
import { useCSPContext } from '../../internals/csp-context/CSPContext';
import type { BaseUIComponentProps } from '../../internals/types';
import type {
  InputChangeEventDetails,
  InputChangeEventReason,
  InputProps,
  InputState,
} from '../../input/Input';
import { usePasswordFieldRootContext } from '../root/PasswordFieldRootContext';

/**
 * The password input.
 * Renders an `<input>` element.
 * It turns `autocomplete` off while revealed, so browsers don't save the password to autofill
 * history.
 *
 * Documentation: [Base UI Password Field](https://base-ui.com/react/components/password-field)
 */
export const PasswordFieldInput = React.forwardRef(function PasswordFieldInput(
  componentProps: PasswordFieldInput.Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
) {
  const {
    disabled: disabledProp = false,
    render,
    className,
    style,
    ...elementProps
  } = componentProps;

  const {
    state: { revealed, disabled: rootDisabled },
    setRevealed,
    initialRevealed,
    inputIdProp,
    setRenderedInputId,
    inputRef,
  } = usePasswordFieldRootContext();

  // Only the render element's id can override the Root's; a spread `id` is still ignored.
  const [id, registerIdRef] = useRenderedId({ render }, inputIdProp, setRenderedInputId);

  // A field that starts revealed mounts as `type="password"` and switches to text once mounted.
  // WebKit, Blink and Gecko all remember that a field has been a password field and keep
  // treating it as one once it's revealed, so they still offer to save a password typed while it
  // shows as text. A field that starts hidden already mounts as one, so it doesn't re-render.
  const [maskedForMount, setMaskedForMount] = React.useState(revealed);
  const showsText = revealed && !maskedForMount;

  // Submitting the owning form hides the password, even when a handler prevents the submit, as
  // most React forms do. Resetting it restores the initial visibility. Both are our own behaviour,
  // so they're canceled through `onRevealedChange`, not by preventing the native event: that
  // only cancels what the browser does, such as resetting the values. Neither has to happen
  // before the browser reads the form, because `autocomplete` and mounting as a password
  // protect the value whatever its type is then.
  //
  // A handler can reset and submit in one go, before either change renders, so the last
  // accepted change is kept until the current script finishes.
  const pendingRevealedRef = React.useRef<boolean | null>(null);

  const handleFormEvent = useStableCallback((event: Event) => {
    if (event.target !== inputRef.current?.form) {
      return;
    }
    const isReset = event.type === 'reset';
    const nextRevealed = isReset ? initialRevealed : false;
    if (nextRevealed === (pendingRevealedRef.current ?? revealed)) {
      return;
    }
    const eventDetails = createChangeEventDetails(
      isReset ? REASONS.formReset : REASONS.formSubmit,
      event,
    );
    setRevealed(nextRevealed, eventDetails);
    if (!eventDetails.isCanceled) {
      if (pendingRevealedRef.current === null) {
        queueMicrotask(() => {
          pendingRevealedRef.current = null;
        });
      }
      pendingRevealedRef.current = nextRevealed;
    }
  });

  // Subscribes whenever a native input is attached, so one rendered after the Root, or later by
  // a render element, is covered too. The merged ref calls the cleanup when the input detaches.
  const subscribeRef = React.useCallback(
    (input: HTMLInputElement | null) => {
      // Attach the listeners to the input's tree and not the document because, when the input
      // and its form are portaled into a shadow root, `submit` and `reset` fire there and never
      // reach the document.
      if (!input) {
        return undefined;
      }
      const rootNode = input.getRootNode();
      setMaskedForMount(false);

      // The capture listeners run before any form handler can stop the event's propagation.
      // The input's form is read when the events fire, so a late or changed form owner is
      // followed.
      return mergeCleanups(
        addEventListener(rootNode, 'reset', handleFormEvent, true),
        addEventListener(rootNode, 'submit', handleFormEvent, true),
      );
    },
    [handleFormEvent],
  );

  const { nonce, disableStyleElements } = useCSPContext();

  const control = useFieldControl({
    ...elementProps,
    // `id` resolves through the Root so the toggle's `aria-controls` and a Field's label follow
    // a render element's id.
    id,
    disabled: rootDisabled || disabledProp,
  });

  const state: PasswordFieldInput.State = { ...control.state, revealed };

  const element = useRenderElement('input', componentProps, {
    ref: [forwardedRef, inputRef, registerIdRef, subscribeRef, control.ref],
    state,
    props: [
      // Password-friendly defaults; consumer props override them.
      {
        autoComplete: 'current-password',
        autoCapitalize: 'off',
        autoCorrect: 'off',
        spellCheck: false,
      },
      ...control.props,
      // Hides the browser's own reveal button, through the style rendered below.
      { className: styleHideNativeReveal.className },
      // The Root owns `type`, so a spread `type` can't break switching. A render element's `type`
      // still wins, like any of its props. While revealed, `autocomplete` is off, which keeps the
      // value out of autofill history whatever the submission path.
      showsText ? { type: 'text', autoComplete: 'off' } : { type: 'password' },
    ],
    stateAttributesMapping: fieldValidityMapping,
  });

  return (
    <React.Fragment>
      {!disableStyleElements && styleHideNativeReveal.getElement(nonce)}
      {element}
    </React.Fragment>
  );
});

export interface PasswordFieldInputState extends InputState {
  /**
   * Whether the password is currently revealed as plain text.
   */
  revealed: boolean;
}

export interface PasswordFieldInputProps
  extends
    Omit<InputProps, 'id' | 'type' | 'className' | 'style' | 'render'>,
    Pick<BaseUIComponentProps<'input', PasswordFieldInputState>, 'className' | 'style' | 'render'> {
  /**
   * Whether the input should ignore user interaction.
   * Use the `disabled` prop on `PasswordField.Root` to disable the toggle as well.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * The browser autofill hint for the input.
   * Use `'new-password'` on sign-up or change-password forms so browsers and password managers
   * offer to generate one.
   * While the password is revealed, the input renders `autocomplete="off"` instead.
   * @default 'current-password'
   */
  autoComplete?: InputProps['autoComplete'] | undefined;
}

export type PasswordFieldInputChangeEventReason = InputChangeEventReason;
export type PasswordFieldInputChangeEventDetails = InputChangeEventDetails;

export namespace PasswordFieldInput {
  export type State = PasswordFieldInputState;
  export type Props = PasswordFieldInputProps;
  export type ChangeEventReason = PasswordFieldInputChangeEventReason;
  export type ChangeEventDetails = PasswordFieldInputChangeEventDetails;
}
