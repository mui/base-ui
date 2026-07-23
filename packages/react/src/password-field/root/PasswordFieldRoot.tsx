'use client';
import * as React from 'react';
import { useControlled } from '@base-ui/utils/useControlled';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useRenderElement } from '../../internals/useRenderElement';
import { useFieldRootContext } from '../../internals/field-root-context/FieldRootContext';
import type { BaseUIComponentProps } from '../../internals/types';
import { type BaseUIChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import { PasswordFieldRootContext } from './PasswordFieldRootContext';

const stateAttributesMapping: StateAttributesMapping<PasswordFieldRootState> = {
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
    visible: visibleProp,
    defaultVisible = false,
    onVisibleChange,
    disabled: disabledProp = false,
    render,
    className,
    style,
    ...elementProps
  } = componentProps;

  // A surrounding `Field.Root` disables the whole field, alongside the local `disabled` prop.
  const { disabled: fieldDisabled } = useFieldRootContext();
  const disabled = disabledProp || (fieldDisabled ?? false);

  const [visible, setVisibleState] = useControlled({
    controlled: visibleProp,
    default: defaultVisible,
    name: 'PasswordField',
    state: 'visible',
  });

  // The input registers its resolved id here so the toggle's `aria-controls` can reference it.
  // Seeding `undefined` means `aria-controls` is omitted until an input actually mounts.
  const [inputId, setInputId] = React.useState<string | undefined>(undefined);

  const setVisible = useStableCallback(
    (nextVisible: boolean, eventDetails: PasswordFieldRoot.ChangeEventDetails) => {
      onVisibleChange?.(nextVisible, eventDetails);

      if (eventDetails.isCanceled) {
        return;
      }

      setVisibleState(nextVisible);
    },
  );

  const state: PasswordFieldRoot.State = React.useMemo(
    () => ({ disabled, visible }),
    [disabled, visible],
  );

  const contextValue: PasswordFieldRootContext = React.useMemo(
    () => ({
      visible,
      setVisible,
      disabled,
      inputId,
      setInputId,
    }),
    [visible, setVisible, disabled, inputId, setInputId],
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

export interface PasswordFieldRootState {
  /**
   * Whether the field should ignore user interaction.
   */
  disabled: boolean;
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
   */
  onVisibleChange?:
    | ((visible: boolean, eventDetails: PasswordFieldRoot.ChangeEventDetails) => void)
    | undefined;
  /**
   * Whether the component should ignore user interaction.
   * Applies to both the input and the toggle.
   * @default false
   */
  disabled?: boolean | undefined;
}

export type PasswordFieldRootChangeEventReason = typeof REASONS.triggerPress | typeof REASONS.none;
export type PasswordFieldRootChangeEventDetails =
  BaseUIChangeEventDetails<PasswordFieldRoot.ChangeEventReason>;

export namespace PasswordFieldRoot {
  export type State = PasswordFieldRootState;
  export type Props = PasswordFieldRootProps;
  export type ChangeEventReason = PasswordFieldRootChangeEventReason;
  export type ChangeEventDetails = PasswordFieldRootChangeEventDetails;
}
