'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useTooltipRootContext } from '../root/TooltipRootContext';
import type { BaseUIComponentProps } from '../../utils/types';
import { triggerOpenStateMapping } from '../../utils/popupStateMapping';
import { useRenderElement } from '../../utils/useRenderElement';
import { mergeProps } from '../../merge-props';

/**
 * An element to attach the tooltip to.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
 */
const TooltipTrigger = React.forwardRef(function TooltipTrigger(
  componentProps: TooltipTrigger.Props,
  forwardedRef: React.ForwardedRef<any>,
) {
  const { className, render, ...intrinsicProps } = componentProps;

  const { open, setTriggerElement, getTriggerProps } = useTooltipRootContext();

  const state: TooltipTrigger.State = React.useMemo(() => ({ open }), [open]);

  const renderElement = useRenderElement('button', componentProps, {
    state,
    ref: [forwardedRef, setTriggerElement],
    props: mergeProps(getTriggerProps, intrinsicProps),
    customStyleHookMapping: triggerOpenStateMapping,
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
