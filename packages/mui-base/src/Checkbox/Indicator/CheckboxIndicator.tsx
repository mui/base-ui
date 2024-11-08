'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useCheckboxRootContext } from '../Root/CheckboxRootContext.js';
import { useComponentRenderer } from '../../utils/useComponentRenderer.js';
import { useCustomStyleHookMapping } from '../utils/useCustomStyleHookMapping.js';
import type { CheckboxRoot } from '../Root/CheckboxRoot.js';
import type { BaseUIComponentProps } from '../../utils/types.js';

/**
 * The indicator part of the Checkbox.
 *
 * Demos:
 *
 * - [Checkbox](https://base-ui.netlify.app/components/react-checkbox/)
 *
 * API:
 *
 * - [CheckboxIndicator API](https://base-ui.netlify.app/components/react-checkbox/#api-reference-CheckboxIndicator)
 */
const CheckboxIndicator = React.forwardRef(function CheckboxIndicator(
  props: CheckboxIndicator.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, className, keepMounted = true, ...otherProps } = props;

  const ownerState = useCheckboxRootContext();

  const customStyleHookMapping = useCustomStyleHookMapping(ownerState);

  const { renderElement } = useComponentRenderer({
    render: render ?? 'span',
    ref: forwardedRef,
    ownerState,
    className,
    customStyleHookMapping,
    extraProps: otherProps,
  });

  const shouldRender = keepMounted || ownerState.checked || ownerState.indeterminate;
  if (!shouldRender) {
    return null;
  }

  return renderElement();
});

namespace CheckboxIndicator {
  export interface OwnerState extends CheckboxRoot.OwnerState {}
  export interface Props extends BaseUIComponentProps<'span', OwnerState> {
    /**
     * If `true`, the indicator stays mounted when unchecked. Useful for CSS animations.
     * @default true
     */
    keepMounted?: boolean;
  }
}

CheckboxIndicator.propTypes /* remove-proptypes */ = {
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
   * If `true`, the indicator stays mounted when unchecked. Useful for CSS animations.
   * @default true
   */
  keepMounted: PropTypes.bool,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { CheckboxIndicator };
