'use client';
import * as React from 'react';
import { useNumberFieldRootContext } from '../root/NumberFieldRootContext';
import { useNumberFieldButton } from '../root/useNumberFieldButton';
import type { NumberFieldRoot } from '../root/NumberFieldRoot';
import type { BaseUIComponentProps } from '../../utils/types';
import { stateAttributesMapping } from '../utils/stateAttributesMapping';
import { useRenderElement } from '../../utils/useRenderElement';

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
  const { render, className, disabled: disabledProp = false, ...elementProps } = componentProps;

  const {
    state,
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
    props: [getCommonButtonProps(true), elementProps],
    stateAttributesMapping,
  });

  return element;
});

export namespace NumberFieldIncrement {
  export interface State extends NumberFieldRoot.State {}

  export interface Props extends BaseUIComponentProps<'button', State> {}
}
