'use client';
import * as React from 'react';
import { BaseUIComponentProps, NativeButtonProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useButton } from '../../use-button';
import { useNumberFieldRootContext } from '../root/NumberFieldRootContext';
import type { NumberFieldRoot } from '../root/NumberFieldRoot';
import { useNumberFieldButton } from '../root/useNumberFieldButton';
import { stateAttributesMapping } from '../utils/stateAttributesMapping';

/**
 * A stepper button that decreases the field value when clicked.
 * Renders an `<button>` element.
 *
 * Documentation: [Base UI Number Field](https://base-ui.com/react/components/number-field)
 */
export const NumberFieldDecrement = React.forwardRef(function NumberFieldDecrement(
  componentProps: NumberFieldDecrement.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    render,
    className,
    disabled: disabledProp = false,
    nativeButton = true,
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
    intentionalTouchCheckTimeout,
    isPressedRef,
    maxWithDefault,
    minWithDefault,
    movesAfterTouchRef,
    readOnly,
    setValue,
    startAutoChange,
    state,
    stopAutoChange,
    value,
    valueRef,
    locale,
    lastChangedValueRef,
    onValueCommitted,
  } = useNumberFieldRootContext();

  const disabled = disabledProp || contextDisabled;

  const { props } = useNumberFieldButton({
    isIncrement: false,
    inputRef,
    startAutoChange,
    stopAutoChange,
    minWithDefault,
    maxWithDefault,
    value,
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
    isPressedRef,
    intentionalTouchCheckTimeout,
    movesAfterTouchRef,
    locale,
    lastChangedValueRef,
    onValueCommitted,
  });

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: nativeButton,
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

export namespace NumberFieldDecrement {
  export interface State extends NumberFieldRoot.State {}

  export interface Props extends NativeButtonProps, BaseUIComponentProps<'button', State> {}
}
