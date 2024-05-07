'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingDelayGroup } from '@floating-ui/react';
import type { TooltipGroupProps } from './TooltipGroup.types';

/**
 * Groups tooltips' delays together so that once one of the tooltips opens, subsequent tooltips will
 * not open with a delay.
 *
 * Demos:
 *
 * - [Tooltip](https://mui.com/base-ui/react-tooltip/)
 *
 * API:
 *
 * - [TooltipGroup API](https://mui.com/base-ui/react-tooltip/components-api/#tooltip-group)
 */
function TooltipGroup(props: TooltipGroupProps) {
  const { delay = 0, closeDelay = 0, timeout = 400 } = props;
  return (
    <FloatingDelayGroup delay={{ open: delay, close: closeDelay }} timeoutMs={timeout}>
      {props.children}
    </FloatingDelayGroup>
  );
}

TooltipGroup.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * The delay in milliseconds until the tooltip content is closed.
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

export { TooltipGroup };
