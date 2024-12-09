'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingDelayGroup } from '@floating-ui/react';

/**
 * Provides a shared delay for tooltips so that once a tooltip is shown, the rest of the tooltips in
 * the group will not wait for the delay before showing.
 */
const TooltipProvider: React.FC<TooltipProvider.Props> = function TooltipProvider(props) {
  const { delay, closeDelay, timeout = 400 } = props;
  return (
    <FloatingDelayGroup delay={{ open: delay ?? 0, close: closeDelay ?? 0 }} timeoutMs={timeout}>
      {props.children}
    </FloatingDelayGroup>
  );
};

namespace TooltipProvider {
  export interface Props {
    children?: React.ReactNode;
    /**
     * The delay in milliseconds until tooltips within the group are open.
     */
    delay?: number;
    /**
     * The delay in milliseconds until tooltips within the group are closed.
     */
    closeDelay?: number;
    /**
     * The timeout in milliseconds until the grouping logic is no longer active after the last tooltip
     * in the group has closed.
     * @default 400
     */
    timeout?: number;
  }
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
   * The delay in milliseconds until tooltips within the group are closed.
   */
  closeDelay: PropTypes.number,
  /**
   * The delay in milliseconds until tooltips within the group are open.
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
