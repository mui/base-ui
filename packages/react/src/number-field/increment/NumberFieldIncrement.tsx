'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useButton } from '../../use-button';
import { useNumberFieldRootContext } from '../root/NumberFieldRootContext';
import { useNumberFieldButton } from '../root/useNumberFieldButton';
import type { NumberFieldRoot } from '../root/NumberFieldRoot';
import { styleHookMapping } from '../utils/styleHooks';

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
    allowInputSyncRef,
    disabled: contextDisabled,
    formatOptionsRef,
    getStepAmount,
    id,
    incrementValue,
    inputRef,
    inputValue,
    intentionalTouchCheckTimeoutRef,
    isPressedRef,
    locale,
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
  } = useNumberFieldRootContext();

  const disabled = disabledProp || contextDisabled;

  const { props } = useNumberFieldButton({
    isIncrement: true,
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
    intentionalTouchCheckTimeoutRef,
    movesAfterTouchRef,
    locale,
  });

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    buttonRef: forwardedRef,
  });

  const renderElement = useRenderElement('button', componentProps, {
    state,
    ref: buttonRef,
    props: [props, elementProps, getButtonProps],
    customStyleHookMapping: styleHookMapping,
  });

  return renderElement();
});

export namespace NumberFieldIncrement {
  export interface State extends NumberFieldRoot.State {}
  export interface Props extends BaseUIComponentProps<'button', State> {}
}
