'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useNumberFieldRootContext } from '../root/NumberFieldRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { NumberFieldRoot } from '../root/NumberFieldRoot';
import type { BaseUIComponentProps } from '../../utils/types';

/**
 * Groups interactive `NumberField` components together.
 */
const NumberFieldGroup = React.forwardRef(function NumberFieldGroup(
  props: NumberFieldGroup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, ...otherProps } = props;

  const { getGroupProps, state } = useNumberFieldRootContext();

  const { renderElement } = useComponentRenderer({
    propGetter: getGroupProps,
    ref: forwardedRef,
    render: render ?? 'div',
    state,
    className,
    extraProps: otherProps,
  });

  return renderElement();
});

namespace NumberFieldGroup {
  export interface State extends NumberFieldRoot.State {}
  export interface Props extends BaseUIComponentProps<'div', State> {}
}

NumberFieldGroup.propTypes /* remove-proptypes */ = {
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

export { NumberFieldGroup };
