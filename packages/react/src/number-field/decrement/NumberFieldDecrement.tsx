'use client';
import * as React from 'react';
import { useNumberFieldRootContext } from '../root/NumberFieldRootContext';
import type { NumberFieldRoot } from '../root/NumberFieldRoot';
import { useNumberFieldButton } from '../root/useNumberFieldButton';
import type { BaseUIComponentProps } from '../../utils/types';
import { stateAttributesMapping } from '../utils/stateAttributesMapping';
import { useRenderElement } from '../../utils/useRenderElement';

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
  const { render, className, disabled: disabledProp = false, ...elementProps } = componentProps;

  const {
    allowInputSyncRef,
    disabled,
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
  } = useNumberFieldRootContext();

  const { getCommonButtonProps } = useNumberFieldButton({
    inputRef,
    startAutoChange,
    stopAutoChange,
    minWithDefault,
    maxWithDefault,
    value,
    inputValue,
    disabled: disabledProp || disabled,
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
  });

  const element = useRenderElement('button', componentProps, {
    ref: forwardedRef,
    state,
    props: [getCommonButtonProps(false), elementProps],
    stateAttributesMapping,
  });

  return element;
});

export namespace NumberFieldDecrement {
  export interface State extends NumberFieldRoot.State {}

  export interface Props extends BaseUIComponentProps<'button', State> {}
}
