'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useMenuRadioItemContext } from '../radio-item/MenuRadioItemContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { BaseUIComponentProps } from '../../utils/types';
import { itemMapping } from '../utils/styleHookMapping';

/**
 * Indicates whether the radio item is selected.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
const MenuRadioItemIndicator = React.forwardRef(function MenuRadioItemIndicatorComponent(
  props: MenuRadioItemIndicator.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, className, keepMounted = true, ...other } = props;

  const state = useMenuRadioItemContext();

  const { renderElement } = useComponentRenderer({
    render: render || 'span',
    className,
    state,
    customStyleHookMapping: itemMapping,
    extraProps: other,
    ref: forwardedRef,
  });

  if (!keepMounted && !state.checked) {
    return null;
  }

  return renderElement();
});

MenuRadioItemIndicator.propTypes /* remove-proptypes */ = {
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
   * Whether to keep the HTML element in the DOM when the radio item is inactive.
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

namespace MenuRadioItemIndicator {
  export interface Props extends BaseUIComponentProps<'span', State> {
    /**
     * Whether to keep the HTML element in the DOM when the radio item is inactive.
     * @default true
     */
    keepMounted?: boolean;
  }

  export interface State {
    /**
     * Whether the radio item is currently selected.
     */
    checked: boolean;
    disabled: boolean;
    highlighted: boolean;
  }
}

export { MenuRadioItemIndicator };
