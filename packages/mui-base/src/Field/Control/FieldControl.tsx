'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type {
  FieldControlElement,
  FieldControlOwnerState,
  FieldControlProps,
} from './FieldControl.types';
import { useFieldControl } from './useFieldControl';
import { useFieldRootContext } from '../Root/FieldRootContext';

/**
 * The field's control element.
 *
 * Demos:
 *
 * - [Field](https://mui.com/base-ui/react-field/)
 *
 * API:
 *
 * - [FieldControl API](https://mui.com/base-ui/react-field/components-api/#field-control)
 */
const FieldControl = React.forwardRef(function FieldControl(
  props: FieldControlProps,
  forwardedRef: React.ForwardedRef<FieldControlElement>,
) {
  const { render, id, className, ...otherProps } = props;

  const { disabled } = useFieldRootContext();

  const { getControlProps } = useFieldControl({ id });

  const ownerState: FieldControlOwnerState = {
    disabled,
  };

  const { renderElement } = useComponentRenderer({
    propGetter: getControlProps,
    render: render ?? 'input',
    ref: forwardedRef,
    className,
    ownerState,
    extraProps: otherProps,
  });

  return renderElement();
});

FieldControl.propTypes /* remove-proptypes */ = {
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

export { FieldControl };
