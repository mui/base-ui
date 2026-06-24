'use client';
import * as React from 'react';
import { useControlled } from '@base-ui/utils/useControlled';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useRenderElement } from '../../internals/useRenderElement';
import { useFieldRootContext } from '../../internals/field-root-context/FieldRootContext';
import type { BaseUIComponentProps } from '../../internals/types';
import { type BaseUIChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { PasswordToggleFieldRootContext } from './PasswordToggleFieldRootContext';

/**
 * Groups the password input and its visibility toggle.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Password Toggle Field](https://base-ui.com/react/components/password-toggle-field)
 */
export const PasswordToggleFieldRoot = React.forwardRef(function PasswordToggleFieldRoot(
  componentProps: PasswordToggleFieldRoot.Props,
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
    name: 'PasswordToggleField',
    state: 'visible',
  });

  const inputRef = React.useRef<HTMLInputElement | null>(null);

  // The input registers its resolved id here so the toggle's `aria-controls` can reference it.
  // Seeding `undefined` means `aria-controls` is omitted until an input actually mounts.
  const [inputId, setInputId] = React.useState<string | undefined>(undefined);

  const setVisible = useStableCallback(
    (nextVisible: boolean, eventDetails: PasswordToggleFieldRoot.ChangeEventDetails) => {
      onVisibleChange?.(nextVisible, eventDetails);

      if (eventDetails.isCanceled) {
        return;
      }

      setVisibleState(nextVisible);
    },
  );

  // Visibility lives on the toggle (`data-pressed`/`aria-pressed`) and the input's native
  // `type`; the root only exposes whether the whole field is disabled.
  const state: PasswordToggleFieldRoot.State = React.useMemo(() => ({ disabled }), [disabled]);

  const contextValue: PasswordToggleFieldRootContext = React.useMemo(
    () => ({
      visible,
      setVisible,
      disabled,
      inputRef,
      inputId,
      setInputId,
    }),
    [visible, setVisible, disabled, inputId, setInputId],
  );

  const element = useRenderElement('div', componentProps, {
    ref: forwardedRef,
    state,
    props: elementProps,
  });

  return (
    <PasswordToggleFieldRootContext.Provider value={contextValue}>
      {element}
    </PasswordToggleFieldRootContext.Provider>
  );
});

export interface PasswordToggleFieldRootState {
  /**
   * Whether the field should ignore user interaction.
   */
  disabled: boolean;
}

export interface PasswordToggleFieldRootProps extends BaseUIComponentProps<
  'div',
  PasswordToggleFieldRootState
> {
  /**
   * Whether the password is currently revealed as plain text.
   *
   * To render an uncontrolled password toggle field, use the `defaultVisible` prop instead.
   */
  visible?: boolean | undefined;
  /**
   * Whether the password is initially revealed as plain text.
   *
   * To render a controlled password toggle field, use the `visible` prop instead.
   * @default false
   */
  defaultVisible?: boolean | undefined;
  /**
   * Callback fired when the password visibility changes.
   */
  onVisibleChange?:
    | ((visible: boolean, eventDetails: PasswordToggleFieldRoot.ChangeEventDetails) => void)
    | undefined;
  /**
   * Whether the component should ignore user interaction.
   * Applies to both the input and the toggle.
   * @default false
   */
  disabled?: boolean | undefined;
}

export type PasswordToggleFieldRootChangeEventReason = typeof REASONS.none;
export type PasswordToggleFieldRootChangeEventDetails =
  BaseUIChangeEventDetails<PasswordToggleFieldRoot.ChangeEventReason>;

export namespace PasswordToggleFieldRoot {
  export type State = PasswordToggleFieldRootState;
  export type Props = PasswordToggleFieldRootProps;
  export type ChangeEventReason = PasswordToggleFieldRootChangeEventReason;
  export type ChangeEventDetails = PasswordToggleFieldRootChangeEventDetails;
}
