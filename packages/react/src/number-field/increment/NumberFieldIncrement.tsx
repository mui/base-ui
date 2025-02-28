'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useNumberFieldRootContext } from '../root/NumberFieldRootContext';
import { useNumberFieldButton } from '../root/useNumberFieldButton';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { NumberFieldRoot } from '../root/NumberFieldRoot';
import type { BaseUIComponentProps, GenericHTMLProps } from '../../utils/types';

/**
 * A stepper button that increases the field value when clicked.
 * Renders an `<button>` element.
 *
 * Documentation: [Base UI Number Field](https://base-ui.com/react/components/number-field)
 */
const NumberFieldIncrement = React.forwardRef(function NumberFieldIncrement(
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
    intentionalTouchCheckTimeoutRef,
    movesAfterTouchRef,
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
    intentionalTouchCheckTimeoutRef,
    movesAfterTouchRef,
  });

  const propGetter = React.useCallback(
    (externalProps: GenericHTMLProps) => getCommonButtonProps(true, externalProps),
    [getCommonButtonProps],
  );

  const { renderElement } = useComponentRenderer({
    propGetter,
    ref: forwardedRef,
    render: render ?? 'button',
    state,
    className,
    extraProps: otherProps,
  });

  return renderElement();
});

namespace NumberFieldIncrement {
  export interface State extends NumberFieldRoot.State {}
  export interface Props extends BaseUIComponentProps<'button', State> {}
}

export { NumberFieldIncrement };

NumberFieldIncrement.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * @ignore
   */
  disabled: PropTypes.bool,
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;
