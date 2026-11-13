'use client';
import * as React from 'react';
import { addEventListener } from '@base-ui/utils/addEventListener';
import { mergeCleanups } from '@base-ui/utils/mergeCleanups';
import { useControlled } from '@base-ui/utils/useControlled';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useRenderElement } from '../../internals/useRenderElement';
import { useBaseUiId } from '../../internals/useBaseUiId';
import { NOOP } from '../../internals/noop';
import { useFieldRootContext } from '../../internals/field-root-context/FieldRootContext';
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

  const { disabled: fieldDisabled, state: fieldState } = useFieldRootContext();
  const disabled = fieldDisabled || disabledProp;

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

  const rootRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  useIsoLayoutEffect(() => {
    const rootNode = rootRef.current?.getRootNode();
    if (!rootNode) {
      return undefined;
    }

    // The root node receives the events after handlers on the form could cancel a reset, and
    // the input's form is read when they fire, so a late or changed form owner is followed.
    return mergeCleanups(
      addEventListener(rootNode, 'reset', (event) => {
        if (event.target === inputRef.current?.form && !event.defaultPrevented) {
          setVisible(initialVisible, createChangeEventDetails(REASONS.formReset, event));
        }
      }),
      // A prevented submit hides too: a revealed password must not outlive a submission attempt.
      addEventListener(rootNode, 'submit', (event) => {
        if (event.target === inputRef.current?.form) {
          setVisible(false, createChangeEventDetails(REASONS.formSubmit, event));
        }
      }),
    );
  }, [initialVisible, setVisible]);

  const state: PasswordFieldRoot.State = React.useMemo(
    () => ({ ...fieldState, disabled, visible }),
    [fieldState, disabled, visible],
  );

  const contextValue: PasswordFieldRootContext = React.useMemo(
    () => ({
      visible,
      setVisible,
      disabled,
      inputId,
      inputIdProp,
      inputRef,
    }),
    [visible, setVisible, disabled, inputId, inputIdProp],
  );

  const element = useRenderElement('div', componentProps, {
    ref: [forwardedRef, rootRef],
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
   * Besides the toggle, resetting the owning form restores the initial visibility, and
   * submitting it hides the password.
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
  typeof REASONS.triggerPress | typeof REASONS.formReset | typeof REASONS.formSubmit;
export type PasswordFieldRootChangeEventDetails =
  BaseUIChangeEventDetails<PasswordFieldRoot.ChangeEventReason>;

export namespace PasswordFieldRoot {
  export type State = PasswordFieldRootState;
  export type Props = PasswordFieldRootProps;
  export type ChangeEventReason = PasswordFieldRootChangeEventReason;
  export type ChangeEventDetails = PasswordFieldRootChangeEventDetails;
}
