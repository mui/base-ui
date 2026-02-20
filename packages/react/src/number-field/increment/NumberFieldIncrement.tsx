'use client';
import * as React from 'react';
import type { NativeButtonComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useButton } from '../../use-button';
import { useNumberFieldRootContext } from '../root/NumberFieldRootContext';
import { useNumberFieldButton } from '../root/useNumberFieldButton';
import type { NumberFieldRoot } from '../root/NumberFieldRoot';
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
    locale,
    maxWithDefault,
    movesAfterTouchRef,
    readOnly,
    setValue,
    startAutoChange,
    state,
    stopAutoChange,
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
    startAutoChange,
    stopAutoChange,
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
}) as NumberFieldIncrementComponent;

export interface NumberFieldIncrementState extends NumberFieldRoot.State {}

export type NumberFieldIncrementProps<
  TNativeButton extends boolean,
  TElement extends React.ElementType,
> = NativeButtonComponentProps<TNativeButton, TElement, NumberFieldIncrement.State>;

export namespace NumberFieldIncrement {
  export type State = NumberFieldIncrementState;
  export type Props<
    TNativeButton extends boolean = true,
    TElement extends React.ElementType = 'button',
  > = NumberFieldIncrementProps<TNativeButton, TElement>;
}

type NumberFieldIncrementComponent = <
  TNativeButton extends boolean = true,
  TElement extends React.ElementType = 'button',
>(
  props: NumberFieldIncrement.Props<TNativeButton, TElement> & {
    ref?: React.Ref<HTMLButtonElement> | undefined;
  },
) => React.ReactElement | null;
