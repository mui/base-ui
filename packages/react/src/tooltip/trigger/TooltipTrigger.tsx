'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useTooltipRootContext } from '../root/TooltipRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { BaseUIComponentProps } from '../../utils/types';
import { triggerOpenStateMapping } from '../../utils/popupStateMapping';
import { button } from '../../utils/renderFunctions';

/**
 * An element to attach the tooltip to.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
 */
const TooltipTrigger = React.forwardRef(function TooltipTrigger(
  props: TooltipTrigger.Props,
  ref: React.ForwardedRef<any>,
) {
  const { className, render, ...otherProps } = props;

  const { open, setTriggerElement, getTriggerProps } = useTooltipRootContext();

  const state: TooltipTrigger.State = React.useMemo(() => ({ open }), [open]);

  const { renderElement } = useComponentRenderer(props, {
    state,
    render: button,
    ref: [ref, setTriggerElement],
    props: [getTriggerProps, otherProps],
    styleHookMapping: triggerOpenStateMapping,
  });

  return renderElement();
});

namespace TooltipTrigger {
  export interface State {
    /**
     * Whether the tooltip is currently open.
     */
    open: boolean;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {}
}

TooltipTrigger.propTypes /* remove-proptypes */ = {
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
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { TooltipTrigger };
