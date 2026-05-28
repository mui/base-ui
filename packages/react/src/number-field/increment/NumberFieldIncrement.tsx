'use client';
import * as React from 'react';
import type { BaseUIComponentProps, NativeButtonProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useButton } from '../../internals/use-button';
import { useNumberFieldRootContext } from '../root/NumberFieldRootContext';
import { useNumberFieldButton } from '../root/useNumberFieldButton';
import type { NumberFieldRootState } from '../root/NumberFieldRoot';
import { stateAttributesMapping } from '../utils/stateAttributesMapping';

/**
 * A stepper button that increases the field value when clicked.
 * Renders an `<button>` element.
 *
 * Documentation: [Base UI Number Field](https://base-ui.com/react/components/number-field)
 */
export const NumberFieldIncrement = React.forwardRef(function NumberFieldIncrement(
  componentProps: NumberFieldIncrement.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    render,
    className,
    disabled: disabledProp = false,
    nativeButton = true,
    style,
    ...elementProps
  } = componentProps;

  const {
    allowInputSyncRef,
    disabled: contextDisabled,
    formatOptionsRef,
    getStepAmount,
    id,
    incrementValue,
    inputRef,
    inputValue,
    locale,
    maxWithDefault,
    readOnly,
    setValue,
    state,
    value,
    valueRef,
    lastChangedValueRef,
    onValueCommitted,
  } = useNumberFieldRootContext();

  const isMax = value != null && value >= maxWithDefault;
  const disabled = disabledProp || contextDisabled || isMax;

  const props = useNumberFieldButton({
    isIncrement: true,
    inputRef,
    inputValue,
    disabled,
    readOnly,
    id,
    setValue,
    getStepAmount,
    incrementValue,
    allowInputSyncRef,
    formatOptionsRef,
    valueRef,
    locale,
    lastChangedValueRef,
    onValueCommitted,
  });

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: nativeButton,
    focusableWhenDisabled: true,
  });

  const buttonState = React.useMemo(
    () => ({
      ...state,
      disabled,
    }),
    [state, disabled],
  );

  const element = useRenderElement('button', componentProps, {
    ref: [forwardedRef, buttonRef],
    state: buttonState,
    props: [props, elementProps, getButtonProps],
    stateAttributesMapping,
  });

  return element;
});

export interface NumberFieldIncrementState extends NumberFieldRootState {}

export interface NumberFieldIncrementProps
  extends NativeButtonProps, BaseUIComponentProps<'button', NumberFieldIncrementState> {}

export namespace NumberFieldIncrement {
  export type State = NumberFieldIncrementState;
  export type Props = NumberFieldIncrementProps;
}
