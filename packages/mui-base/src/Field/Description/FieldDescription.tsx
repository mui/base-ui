'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { FieldDescriptionProps } from './FieldDescription.types';
import { useFieldRootContext } from '../Root/FieldRootContext';
import { useFieldDescription } from './useFieldDescription';
import { STYLE_HOOK_MAPPING } from '../utils/constants';

/**
 * A description message for the field's control.
 *
 * Demos:
 *
 * - [Field](https://mui.com/base-ui/react-field/)
 *
 * API:
 *
 * - [FieldDescription API](https://mui.com/base-ui/react-field/components-api/#field-description)
 */
const FieldDescription = React.forwardRef(function FieldDescription(
  props: FieldDescriptionProps,
  forwardedRef: React.ForwardedRef<HTMLParagraphElement>,
) {
  const { render, id, className, ...otherProps } = props;

  const { ownerState } = useFieldRootContext(false);

  const { getDescriptionProps } = useFieldDescription({ id });

  const { renderElement } = useComponentRenderer({
    propGetter: getDescriptionProps,
    render: render ?? 'p',
    ref: forwardedRef,
    className,
    ownerState,
    extraProps: otherProps,
    customStyleHookMapping: STYLE_HOOK_MAPPING,
  });

  return renderElement();
});

FieldDescription.propTypes /* remove-proptypes */ = {
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

export { FieldDescription };
