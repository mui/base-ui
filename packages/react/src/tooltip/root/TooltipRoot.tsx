'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { TooltipRootContext } from './TooltipRootContext';
import { useTooltipRoot } from './useTooltipRoot';
import { OPEN_DELAY } from '../utils/constants';
import { PortalContext } from '../../portal/PortalContext';

/**
 * Groups all parts of the tooltip.
 * Doesn’t render its own HTML element.
 *
 * Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
 */
const TooltipRoot: React.FC<TooltipRoot.Props> = function TooltipRoot(props) {
  const { delay, closeDelay, hoverable = true, trackCursorAxis = 'none', onClosed } = props;

  const delayWithDefault = delay ?? OPEN_DELAY;
  const closeDelayWithDefault = closeDelay ?? 0;

  const {
    open,
    setOpen,
    mounted,
    setMounted,
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
    trackCursorAxis,
    delay,
    closeDelay,
    onClosed,
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
    <TooltipRootContext.Provider value={contextValue}>
      <PortalContext.Provider value={mounted}>{props.children}</PortalContext.Provider>
    </TooltipRootContext.Provider>
  );
};

namespace TooltipRoot {
  export interface State {}

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
