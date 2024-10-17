'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { TooltipRootContext } from './TooltipRootContext';
import { useTooltipRoot } from './useTooltipRoot';
import { OPEN_DELAY } from '../utils/constants';

/**
 * The foundation for building custom-styled tooltips.
 *
 * Demos:
 *
 * - [Tooltip](https://base-ui.netlify.app/components/react-tooltip/)
 *
 * API:
 *
 * - [TooltipRoot API](https://base-ui.netlify.app/components/react-tooltip/#api-reference-TooltipRoot)
 */
const TooltipRoot: React.FC<TooltipRoot.Props> = function TooltipRoot(props) {
  const { delay, closeDelay, hoverable = true, animated = true, trackCursorAxis = 'none' } = props;

  const delayWithDefault = delay ?? OPEN_DELAY;
  const closeDelayWithDefault = closeDelay ?? 0;

  const {
    open,
    setOpen,
    mounted,
    setMounted,
    triggerElement,
    setTriggerElement,
    positionerElement,
    setPositionerElement,
    popupRef,
    instantType,
    getRootTriggerProps,
    getRootPopupProps,
    floatingRootContext,
    transitionStatus,
  } = useTooltipRoot({
    hoverable,
    animated,
    trackCursorAxis,
    delay,
    closeDelay,
    open: props.open,
    onOpenChange: props.onOpenChange,
    defaultOpen: props.defaultOpen,
  });

  const contextValue = React.useMemo(
    () => ({
      delay: delayWithDefault,
      closeDelay: closeDelayWithDefault,
      open,
      setOpen,
      triggerElement,
      setTriggerElement,
      positionerElement,
      setPositionerElement,
      popupRef,
      mounted,
      setMounted,
      instantType,
      getRootTriggerProps,
      getRootPopupProps,
      floatingRootContext,
      trackCursorAxis,
      transitionStatus,
    }),
    [
      delayWithDefault,
      closeDelayWithDefault,
      open,
      setOpen,
      triggerElement,
      setTriggerElement,
      positionerElement,
      setPositionerElement,
      popupRef,
      mounted,
      setMounted,
      instantType,
      getRootTriggerProps,
      getRootPopupProps,
      floatingRootContext,
      trackCursorAxis,
      transitionStatus,
    ],
  );

  return (
    <TooltipRootContext.Provider value={contextValue}>{props.children}</TooltipRootContext.Provider>
  );
};

namespace TooltipRoot {
  export interface OwnerState {}

  export interface Props extends useTooltipRoot.Parameters {
    children?: React.ReactNode;
  }
}

TooltipRoot.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * Whether the tooltip can animate, adding animation-related attributes and allowing for exit
   * animations to play. Useful to disable in tests to remove async behavior.
   * @default true
   */
  animated: PropTypes.bool,
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * The delay in milliseconds until the tooltip popup is closed.
   * @default 0
   */
  closeDelay: PropTypes.number,
  /**
   * Whether the tooltip popup is open by default. Use when uncontrolled.
   * @default false
   */
  defaultOpen: PropTypes.bool,
  /**
   * The delay in milliseconds until the tooltip popup is opened.
   * @default 600
   */
  delay: PropTypes.number,
  /**
   * Whether the user can move their cursor from the trigger element toward the tooltip popup element
   * without it closing using a "safe polygon" technique.
   * @default true
   */
  hoverable: PropTypes.bool,
  /**
   * Callback fired when the tooltip popup is requested to be opened or closed. Use when controlled.
   */
  onOpenChange: PropTypes.func,
  /**
   * Whether the tooltip popup is open. Use when controlled.
   * @default false
   */
  open: PropTypes.bool,
  /**
   * Determines which axis the tooltip should track the cursor on.
   * @default 'none'
   */
  trackCursorAxis: PropTypes.oneOf(['both', 'none', 'x', 'y']),
} as any;

export { TooltipRoot };
