'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { TooltipRootContext } from './TooltipRootContext';
import { useTooltipRoot } from './useTooltipRoot';
import { OPEN_DELAY } from '../utils/constants';

/**
 * Groups all parts of the tooltip.
 * Doesn’t render its own HTML element.
 *
 * Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
 */
const TooltipRoot: React.FC<TooltipRoot.Props> = function TooltipRoot(props) {
  const {
    defaultOpen = false,
    onOpenChange,
    open,
    delay,
    closeDelay,
    hoverable = true,
    trackCursorAxis = 'none',
    actionsRef,
    onOpenChangeComplete,
  } = props;

  const delayWithDefault = delay ?? OPEN_DELAY;
  const closeDelayWithDefault = closeDelay ?? 0;

  const tooltipRoot = useTooltipRoot({
    ...props,
    defaultOpen,
    onOpenChange,
    open,
    hoverable,
    trackCursorAxis,
    delay,
    closeDelay,
    actionsRef,
    onOpenChangeComplete,
  });

  const contextValue: TooltipRootContext = React.useMemo(
    () => ({
      ...tooltipRoot,
      delay: delayWithDefault,
      closeDelay: closeDelayWithDefault,
      trackCursorAxis,
    }),
    [tooltipRoot, delayWithDefault, closeDelayWithDefault, trackCursorAxis],
  );

  return (
    <TooltipRootContext.Provider value={contextValue}>{props.children}</TooltipRootContext.Provider>
  );
};

namespace TooltipRoot {
  export interface State {}

  export interface Props extends useTooltipRoot.Parameters {
    children?: React.ReactNode;
  }

  export type Actions = useTooltipRoot.Actions;
}

TooltipRoot.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * A ref to imperative actions.
   * - `unmount`: When specified, the tooltip will not be unmounted when closed.
   * Instead, the `unmount` function must be called to unmount the tooltip manually.
   * Useful when the tooltip's animation is controlled by an external library.
   */
  actionsRef: PropTypes.shape({
    current: PropTypes.shape({
      unmount: PropTypes.func.isRequired,
    }).isRequired,
  }),
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * How long to wait before closing the tooltip. Specified in milliseconds.
   * @default 0
   */
  closeDelay: PropTypes.number,
  /**
   * Whether the tooltip is initially open.
   *
   * To render a controlled tooltip, use the `open` prop instead.
   * @default false
   */
  defaultOpen: PropTypes.bool,
  /**
   * How long to wait before opening the tooltip. Specified in milliseconds.
   * @default 600
   */
  delay: PropTypes.number,
  /**
   * Whether the tooltip contents can be hovered without closing the tooltip.
   * @default true
   */
  hoverable: PropTypes.bool,
  /**
   * Event handler called when the tooltip is opened or closed.
   */
  onOpenChange: PropTypes.func,
  /**
   * Event handler called after any animations complete when the tooltip is opened or closed.
   */
  onOpenChangeComplete: PropTypes.func,
  /**
   * Whether the tooltip is currently open.
   */
  open: PropTypes.bool,
  /**
   * Determines which axis the tooltip should track the cursor on.
   * @default 'none'
   */
  trackCursorAxis: PropTypes.oneOf(['both', 'none', 'x', 'y']),
} as any;

export { TooltipRoot };
