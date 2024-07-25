'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { FieldsetLegendOwnerState, FieldsetLegendProps } from './FieldsetLegend.types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useFieldsetLegend } from './useFieldsetLegend';
import { useFieldsetRootContext } from '../Root/FieldsetRootContext';

/**
 * Renders an element that labels the fieldset.
 *
 * Demos:
 *
 * - [Fieldset](https://mui.com/base-ui/react-fieldset/)
 *
 * API:
 *
 * - [FieldsetLegend API](https://mui.com/base-ui/react-field/components-api/#fieldset-root)
 */
const FieldsetLegend = React.forwardRef(function FieldsetLegend(
  props: FieldsetLegendProps,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, className, id, ...otherProps } = props;

  const { getLegendProps } = useFieldsetLegend({ id });

  const { disabled } = useFieldsetRootContext();

  const ownerState: FieldsetLegendOwnerState = {
    disabled: disabled ?? false,
  };

  const { renderElement } = useComponentRenderer({
    propGetter: getLegendProps,
    ref: forwardedRef,
    render: render ?? 'span',
    className,
    ownerState,
    extraProps: otherProps,
  });

  return renderElement();
});

FieldsetLegend.propTypes /* remove-proptypes */ = {
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
   * @ignore
   */
  id: PropTypes.string,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { FieldsetLegend };
