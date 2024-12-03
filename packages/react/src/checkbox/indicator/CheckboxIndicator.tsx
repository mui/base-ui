'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useCheckboxRootContext } from '../root/CheckboxRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useCustomStyleHookMapping } from '../utils/useCustomStyleHookMapping';
import type { CheckboxRoot } from '../root/CheckboxRoot';
import type { BaseUIComponentProps } from '../../utils/types';
../../utils/useAfterExitAnimation
/**
 * The indicator part of the Checkbox.
 *
 * Demos:
 *
 * - [Checkbox](https://base-ui.com/components/react-checkbox/)
 *
 * API:
 *
 * - [CheckboxIndicator API](https://base-ui.com/components/react-checkbox/#api-reference-CheckboxIndicator)
 */
const CheckboxIndicator = React.forwardRef(function CheckboxIndicator(
  props: CheckboxIndicator.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, className, keepMounted = true, ...otherProps } = props;

  const state = useCheckboxRootContext();

  const customStyleHookMapping = useCustomStyleHookMapping(state);

  const { renderElement } = useComponentRenderer({
    render: render ?? 'span',
    ref: forwardedRef,
    state,
    className,
    customStyleHookMapping,
    extraProps: otherProps,
  });

  const shouldRender = keepMounted || state.checked || state.indeterminate;
  if (!shouldRender) {
    return null;
  }

  return renderElement();
});

namespace CheckboxIndicator {
  export interface State extends CheckboxRoot.State {}
  export interface Props extends BaseUIComponentProps<'span', State> {
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
