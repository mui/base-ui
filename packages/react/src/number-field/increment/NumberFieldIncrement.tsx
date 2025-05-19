'use client';
import * as React from 'react';
import { useNumberFieldRootContext } from '../root/NumberFieldRootContext';
import { useNumberFieldButton } from '../root/useNumberFieldButton';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { NumberFieldRoot } from '../root/NumberFieldRoot';
import type { BaseUIComponentProps, HTMLProps } from '../../utils/types';
import { stateAttributesMapping } from '../utils/stateAttributesMapping';

/**
 * A stepper button that increases the field value when clicked.
 * Renders an `<button>` element.
 *
 * Documentation: [Base UI Number Field](https://base-ui.com/react/components/number-field)
 */
export const NumberFieldIncrement = React.forwardRef(function NumberFieldIncrement(
  props: NumberFieldIncrement.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { render, className, disabled: disabledProp = false, ...otherProps } = props;

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

  const propGetter = React.useCallback(
    (externalProps: HTMLProps) => getCommonButtonProps(true, externalProps),
    [getCommonButtonProps],
  );

  const { renderElement } = useComponentRenderer({
    propGetter,
    ref: forwardedRef,
    render: render ?? 'button',
    state,
    className,
    extraProps: otherProps,
    stateAttributesMapping,
  });

  return renderElement();
});

export namespace NumberFieldIncrement {
  export interface State extends NumberFieldRoot.State {}
  export interface Props extends BaseUIComponentProps<'button', State> {}
}
