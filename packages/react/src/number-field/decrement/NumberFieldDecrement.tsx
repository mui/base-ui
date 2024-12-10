'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useNumberFieldRootContext } from '../root/NumberFieldRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { NumberFieldRoot } from '../root/NumberFieldRoot';
import { BaseUIComponentProps } from '../../utils/types';

/**
 * A stepper button that decreases the field value when clicked.
 * Renders an `<button>` element.
 *
 * Documentation: [Base UI Number Field](https://base-ui.com/react/components/number-field)
 */
const NumberFieldDecrement = React.forwardRef(function NumberFieldDecrement(
  props: NumberFieldDecrement.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { render, className, ...otherProps } = props;

  const { getDecrementButtonProps, state } = useNumberFieldRootContext();

  const { renderElement } = useComponentRenderer({
    propGetter: getDecrementButtonProps,
    ref: forwardedRef,
    render: render ?? 'button',
    state,
    className,
    extraProps: otherProps,
  });

  return renderElement();
});

namespace NumberFieldDecrement {
  export interface State extends NumberFieldRoot.State {}
  export interface Props extends BaseUIComponentProps<'button', State> {}
}

NumberFieldDecrement.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { NumberFieldDecrement };
