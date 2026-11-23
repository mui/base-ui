'use client';
import * as React from 'react';
import { addEventListener } from '@base-ui/utils/addEventListener';
import { mergeCleanups } from '@base-ui/utils/mergeCleanups';
import { useControlled } from '@base-ui/utils/useControlled';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { useRenderElement } from '../../internals/useRenderElement';
import { useBaseUiId } from '../../internals/useBaseUiId';
import { NOOP } from '../../internals/noop';
import { useFieldRootContext } from '../../internals/field-root-context/FieldRootContext';
import { useFieldsetRootContext } from '../../fieldset/root/FieldsetRootContext';
import { useLabelableContext } from '../../internals/labelable-provider/LabelableContext';
import { fieldValidityMapping } from '../../internals/field-constants/constants';
import type { BaseUIComponentProps } from '../../internals/types';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import type { BaseUIChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import type { FieldRootState } from '../../field/root/FieldRoot';
import { PasswordFieldRootContext } from './PasswordFieldRootContext';

const stateAttributesMapping: StateAttributesMapping<PasswordFieldRootState> = {
  ...fieldValidityMapping,
  visible: () => null,
};

/**
 * Groups the password input and its visibility toggle.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Password Field](https://base-ui.com/react/components/password-field)
 */
export const PasswordFieldRoot = React.forwardRef(function PasswordFieldRoot(
  componentProps: PasswordFieldRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    id: idProp,
    visible: visibleProp,
    defaultVisible = false,
    onVisibleChange,
    disabled: disabledProp = false,
    render,
    className,
    style,
    ...elementProps
  } = componentProps;

  // A native `<fieldset disabled>` doesn't disable a non-native toggle, so the Fieldset's state is
  // read directly, as `Field.Root` does, for a field that isn't wrapped in one.
  const disabledFieldset = useFieldsetRootContext(true)?.disabled;
  const { disabled: fieldDisabled, state: fieldState } = useFieldRootContext();
  const disabled = disabledFieldset || fieldDisabled || disabledProp;

  // `Field.Control` resolves its id as `controlId ?? id`. Inside a Field, an input without an
  // explicit id takes the Field's id, so only a standalone input needs a generated one.
  const { controlId, registerControlId } = useLabelableContext();
  const defaultId = useBaseUiId();
  const inputIdProp = idProp ?? (registerControlId === NOOP ? defaultId : undefined);
  const inputId = controlId ?? inputIdProp;

  const [visible, setVisibleState] = useControlled({
    controlled: visibleProp,
    default: defaultVisible,
    name: 'PasswordField',
    state: 'visible',
  });
  const [initialVisible] = React.useState(visible);

  const setVisible = useStableCallback(
    (nextVisible: boolean, eventDetails: PasswordFieldRoot.ChangeEventDetails) => {
      if (nextVisible === visible) {
        return;
      }

      onVisibleChange?.(nextVisible, eventDetails);

      if (eventDetails.isCanceled) {
        return;
      }

      setVisibleState(nextVisible);
    },
  );

  const inputRef = React.useRef<HTMLInputElement>(null);

  // A revealed password must never be submitted as `type="text"`: browsers can save text inputs to
  // autofill history, and password managers may not recognize them. Submitting therefore masks the
  // input without changing `visible`, so it can't be canceled or overridden by the `visible` prop.
  const [maskedForSubmit, setMaskedForSubmit] = React.useState(false);
  const unmaskTimeout = useTimeout();

  const maskForSubmit = useStableCallback((event: Event) => {
    const input = inputRef.current;
    if (!visible || !input || event.target !== input.form) {
      return;
    }

    // The form data is built right after this event is dispatched, possibly before React
    // commits, so the DOM is masked directly. The state keeps a re-render that React commits
    // first, such as a form handler's update, from rendering `text` again.
    input.type = 'password';
    setMaskedForSubmit(true);
    // The form data has been built by the next task. A prevented submit unmasks then too.
    unmaskTimeout.start(0, () => {
      setMaskedForSubmit(false);
    });
  });

  useIsoLayoutEffect(() => {
    // Attach the listeners to the input's tree and not the Root's because, when the input and its
    // form are portaled into a shadow root, `submit` and `reset` fire there and never reach the
    // Root's document.
    const rootNode = inputRef.current?.getRootNode();
    if (!rootNode) {
      return undefined;
    }

    // Both listen in the capture phase, before any form handler can stop their propagation.
    // The input's form is read when the events fire, so a late or changed form owner is followed.
    return mergeCleanups(
      addEventListener(
        rootNode,
        'reset',
        (event) => {
          if (event.target === inputRef.current?.form) {
            setVisible(initialVisible, createChangeEventDetails(REASONS.formReset, event));
          }
        },
        true,
      ),
      addEventListener(rootNode, 'submit', maskForSubmit, true),
    );
  }, [initialVisible, setVisible, maskForSubmit]);

  const state: PasswordFieldRoot.State = React.useMemo(
    () => ({ ...fieldState, disabled, visible }),
    [fieldState, disabled, visible],
  );

  const contextValue: PasswordFieldRootContext = React.useMemo(
    () => ({
      visible,
      setVisible,
      maskedForSubmit,
      disabled,
      inputId,
      inputIdProp,
      inputRef,
    }),
    [visible, setVisible, maskedForSubmit, disabled, inputId, inputIdProp],
  );

  const element = useRenderElement('div', componentProps, {
    ref: forwardedRef,
    state,
    props: elementProps,
    stateAttributesMapping,
  });

  return (
    <PasswordFieldRootContext.Provider value={contextValue}>
      {element}
    </PasswordFieldRootContext.Provider>
  );
});

export interface PasswordFieldRootState extends FieldRootState {
  /**
   * Whether the password is currently revealed as plain text.
   */
  visible: boolean;
}

export interface PasswordFieldRootProps extends BaseUIComponentProps<
  'div',
  PasswordFieldRootState
> {
  /**
   * The id of the input element.
   */
  id?: string | undefined;
  /**
   * Whether the password is currently revealed as plain text.
   *
   * To render an uncontrolled password field, use the `defaultVisible` prop instead.
   */
  visible?: boolean | undefined;
  /**
   * Whether the password is initially revealed as plain text.
   *
   * To render a controlled password field, use the `visible` prop instead.
   * @default false
   */
  defaultVisible?: boolean | undefined;
  /**
   * Callback fired when the password visibility changes.
   * Besides the toggle, resetting the owning form restores the initial visibility.
   * Cancel `'form-reset'` to prevent it.
   */
  onVisibleChange?:
    ((visible: boolean, eventDetails: PasswordFieldRoot.ChangeEventDetails) => void) | undefined;
  /**
   * Whether the component should ignore user interaction.
   * Applies to both the input and the toggle.
   * @default false
   */
  disabled?: boolean | undefined;
}

export type PasswordFieldRootChangeEventReason =
  typeof REASONS.triggerPress | typeof REASONS.formReset;
export type PasswordFieldRootChangeEventDetails =
  BaseUIChangeEventDetails<PasswordFieldRoot.ChangeEventReason>;

export namespace PasswordFieldRoot {
  export type State = PasswordFieldRootState;
  export type Props = PasswordFieldRootProps;
  export type ChangeEventReason = PasswordFieldRootChangeEventReason;
  export type ChangeEventDetails = PasswordFieldRootChangeEventDetails;
}
