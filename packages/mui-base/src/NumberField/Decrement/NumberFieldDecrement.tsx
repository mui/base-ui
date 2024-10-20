'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useNumberFieldRootContext } from '../Root/NumberFieldRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { NumberFieldRoot } from '../Root/NumberFieldRoot';
import { BaseUIComponentProps } from '../../utils/types';

/**
 * The decrement stepper button.
 *
 * Demos:
 *
 * - [Number Field](https://base-ui.netlify.app/components/react-number-field/)
 *
 * API:
 *
 * - [NumberFieldDecrement API](https://base-ui.netlify.app/components/react-number-field/#api-reference-NumberFieldDecrement)
 */
const NumberFieldDecrement = React.forwardRef(function NumberFieldDecrement(
  props: NumberFieldDecrement.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { render, className, ...otherProps } = props;

  const { getDecrementButtonProps, ownerState } = useNumberFieldRootContext();

  const { renderElement } = useComponentRenderer({
    propGetter: getDecrementButtonProps,
    ref: forwardedRef,
    render: render ?? 'button',
    ownerState,
    className,
    extraProps: otherProps,
  });

  return renderElement();
});

namespace NumberFieldDecrement {
  export interface OwnerState extends NumberFieldRoot.OwnerState {}
  export interface Props extends BaseUIComponentProps<'button', OwnerState> {}
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
