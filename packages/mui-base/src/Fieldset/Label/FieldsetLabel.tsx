import * as React from 'react';
import PropTypes from 'prop-types';
import type { FieldsetLabelProps } from './FieldsetLabel.types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useFieldsetLabel } from './useFieldsetLabel';

/**
 * Renders an element that labels the fieldset.
 *
 * Demos:
 *
 * - [Field](https://mui.com/base-ui/react-fieldset/)
 *
 * API:
 *
 * - [FieldsetLabel API](https://mui.com/base-ui/react-field/components-api/#fieldset-root)
 */
const FieldsetLabel = React.forwardRef(function FieldsetLabel(
  props: FieldsetLabelProps,
  forwardedRef: React.Ref<HTMLElement>,
) {
  const { render, className, id, ...otherProps } = props;

  const { getLabelProps } = useFieldsetLabel({ id });

  const { renderElement } = useComponentRenderer({
    propGetter: getLabelProps,
    ref: forwardedRef,
    render: render ?? 'span',
    className,
    ownerState: {},
    extraProps: otherProps,
  });

  return renderElement();
});

FieldsetLabel.propTypes /* remove-proptypes */ = {
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

export { FieldsetLabel };
