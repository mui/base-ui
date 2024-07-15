import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { FieldLabelProps } from './FieldLabel.types';
import { useFieldRootContext } from '../Root/FieldRootContext';
import { useFieldLabel } from './useFieldLabel';

/**
 * The field's label.
 *
 * Demos:
 *
 * - [Field](https://mui.com/base-ui/react-field/)
 *
 * API:
 *
 * - [FieldLabel API](https://mui.com/base-ui/react-field/components-api/#field-label)
 */
const FieldLabel = React.forwardRef(function FieldLabel(
  props: FieldLabelProps,
  forwardedRef: React.ForwardedRef<HTMLLabelElement>,
) {
  const { render, className, ...otherProps } = props;

  const { controlId } = useFieldRootContext();

  const { getLabelProps } = useFieldLabel({ controlId });

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

FieldLabel.propTypes /* remove-proptypes */ = {
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

export { FieldLabel };
