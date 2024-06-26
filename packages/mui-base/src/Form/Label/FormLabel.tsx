'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { FormLabelProps } from './FormLabel.types';
import { useFormContext } from '../FormContext';
import { useFormLabel } from './useFormLabel';

/**
 * @ignore - internal component.
 */
const FormLabel = React.forwardRef(function FormLabel(
  props: FormLabelProps,
  forwardedRef: React.ForwardedRef<HTMLLabelElement | HTMLSpanElement>,
) {
  const { render, className, ...otherProps } = props;

  const { setLabelId } = useFormContext();

  const { getLabelProps } = useFormLabel({
    id: otherProps.id,
    setId: setLabelId,
  });

  const { renderElement } = useComponentRenderer({
    propGetter: getLabelProps,
    render: render ?? 'label',
    ownerState: {},
    className,
    ref: forwardedRef,
    extraProps: otherProps,
  });

  return renderElement();
});

FormLabel.propTypes /* remove-proptypes */ = {
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
   * Whether to prevent text selection when double clicking the label.
   * @default true
   */
  preventTextSelection: PropTypes.bool,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { FormLabel };
