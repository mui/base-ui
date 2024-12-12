'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useRadioRootContext } from '../root/RadioRootContext';
import { customStyleHookMapping } from '../utils/customStyleHookMapping';

/**
 * Indicates whether the radio button is selected.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Radio](https://base-ui.com/react/components/radio)
 */
const RadioIndicator = React.forwardRef(function RadioIndicator(
  props: RadioIndicator.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, className, keepMounted = true, ...otherProps } = props;

  const state = useRadioRootContext();

  const { renderElement } = useComponentRenderer({
    render: render ?? 'span',
    ref: forwardedRef,
    className,
    state,
    extraProps: otherProps,
    customStyleHookMapping,
  });

  const shouldRender = keepMounted || state.checked;
  if (!shouldRender) {
    return null;
  }

  return renderElement();
});

namespace RadioIndicator {
  export interface Props extends BaseUIComponentProps<'span', State> {
    /**
     * Whether to keep the HTML element in the DOM when the radio button is inactive.
     * @default true
     */
    keepMounted?: boolean;
  }

  export interface State {
    /**
     * Whether the radio button is currently selected.
     */
    checked: boolean;
  }
}

RadioIndicator.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * Whether to keep the HTML element in the DOM when the radio button is inactive.
   * @default true
   */
  keepMounted: PropTypes.bool,
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { RadioIndicator };
