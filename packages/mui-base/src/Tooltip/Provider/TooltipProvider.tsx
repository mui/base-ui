'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingDelayGroup } from '@floating-ui/react';
import type { TooltipProviderProps } from './TooltipProvider.types';

/**
 * Provides a shared delay for tooltips so that once a tooltip is shown, the rest of the tooltips in
 * the group will not wait for the delay before showing.
 *
 * Demos:
 *
 * - [Tooltip](https://mui.com/base-ui/react-tooltip/)
 *
 * API:
 *
 * - [TooltipProvider API](https://mui.com/base-ui/react-tooltip/components-api/#tooltip-provider)
 */
function TooltipProvider(props: TooltipProviderProps) {
  const { delay = 0, closeDelay = 0, timeout = 400 } = props;
  return (
    <FloatingDelayGroup delay={{ open: delay, close: closeDelay }} timeoutMs={timeout}>
      {props.children}
    </FloatingDelayGroup>
  );
}

TooltipProvider.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * he delay in milliseconds until tooltips within the group are closed.
   * @default 0
   */
  closeDelay: PropTypes.number,
  /**
   * The delay in milliseconds until tooltips within the group are open.
   * @default 0
   */
  delay: PropTypes.number,
  /**
   * The timeout in milliseconds until the grouping logic is no longer active after the last tooltip
   * in the group has closed.
   * @default 400
   */
  timeout: PropTypes.number,
} as any;

export { TooltipProvider };
