import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../utils/useComponentRenderer';
import { LabelProps } from './Label.types';
import { useLabel } from './useLabel';

const Label = React.forwardRef(function Label(
  props: LabelProps,
  forwardedRef: React.ForwardedRef<HTMLLabelElement>,
) {
  const { render, className, ...otherProps } = props;

  const { getLabelProps } = useLabel();

  const { renderElement } = useComponentRenderer({
    propGetter: getLabelProps,
    render: render ?? 'label',
    ref: forwardedRef,
    className,
    ownerState: {},
    extraProps: otherProps,
  });

  return renderElement();
});

Label.propTypes /* remove-proptypes */ = {
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

export { Label };
