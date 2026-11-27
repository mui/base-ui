'use client';
import * as React from 'react';
import { addEventListener } from '@base-ui/utils/addEventListener';
import { mergeCleanups } from '@base-ui/utils/mergeCleanups';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useTimeout } from '@base-ui/utils/useTimeout';
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
 * It's masked while its form submits, even when revealed, so the password is never submitted as
 * plain text. This can't be canceled and doesn't call `onRevealedChange`.
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

  const mergedRef = useMergedRefs(forwardedRef, inputRef, registerIdRef);

  // Masks the input while its form submits, without changing `revealed`.
  const [maskedForSubmit, setMaskedForSubmit] = React.useState(false);
  const unmaskTimeout = useTimeout();

  const unmask = useStableCallback(() => {
    setMaskedForSubmit(false);
    // A mask set during a transition may never render, in which case React sees no `type` change
    // and leaves the direct DOM write below in place.
    if (revealed && inputRef.current) {
      inputRef.current.type = 'text';
    }
  });

  const handleSubmit = useStableCallback((event: Event) => {
    const input = inputRef.current;
    if (!input || event.target !== input.form) {
      return;
    }

    // The form data is built right after this event is dispatched, possibly before React
    // commits, so a revealed input is masked directly. The state is set for every submit, so a
    // re-render that React commits first, such as a form handler's update that reveals the
    // password, can't render `text` again.
    if (revealed) {
      input.type = 'password';
    }
    setMaskedForSubmit(true);
    // The form data has been built by the next task. A prevented submit unmasks then too.
    unmaskTimeout.start(0, unmask);
  });

  // A reset of the owning form restores the initial visibility, unless it's canceled: then the
  // browser keeps the value, so the visibility stays too. `defaultPrevented` is only final once
  // the form's handlers have run, so the capture listener notes the reset and the bubble
  // listener, which runs after them, decides.
  const pendingResetRef = React.useRef<Event | null>(null);
  const resetTimeout = useTimeout();

  const commitReset = useStableCallback(() => {
    const event = pendingResetRef.current;
    pendingResetRef.current = null;
    resetTimeout.clear();
    if (event && !event.defaultPrevented) {
      setRevealed(initialRevealed, createChangeEventDetails(REASONS.formReset, event));
    }
  });

  const handleResetCapture = useStableCallback((event: Event) => {
    if (event.target === inputRef.current?.form) {
      pendingResetRef.current = event;
      // A form handler that stops propagation keeps the bubble listener from running, so the
      // reset is decided once the dispatch is over instead.
      resetTimeout.start(0, commitReset);
    }
  });

  const handleResetBubble = useStableCallback((event: Event) => {
    if (event === pendingResetRef.current) {
      commitReset();
    }
  });

  // Subscribes when the input mounts, so an input rendered after the Root is covered too.
  useIsoLayoutEffect(() => {
    // Attach the listeners to the input's tree and not the document because, when the input and
    // its form are portaled into a shadow root, `submit` and `reset` fire there and never reach
    // the document.
    const rootNode = inputRef.current?.getRootNode();
    if (!rootNode) {
      return undefined;
    }

    // The capture listeners run before any form handler can stop the event's propagation.
    // The input's form is read when the events fire, so a late or changed form owner is followed.
    return mergeCleanups(
      addEventListener(rootNode, 'reset', handleResetCapture, true),
      addEventListener(rootNode, 'reset', handleResetBubble),
      // Always mask on submit, with no way to cancel it: a revealed input is plain text, so
      // browsers could save the password to autofill history and password managers may not
      // recognize it.
      addEventListener(rootNode, 'submit', handleSubmit, true),
    );
  }, [inputRef, handleResetCapture, handleResetBubble, handleSubmit]);

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
    ref: [mergedRef, control.ref],
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
      // The Root owns `type` so switching can't break.
      { type: revealed && !maskedForSubmit ? 'text' : 'password' },
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
