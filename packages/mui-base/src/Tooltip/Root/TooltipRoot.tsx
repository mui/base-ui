'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { TooltipRootProps } from './TooltipRoot.types';
import { TooltipRootContext } from './TooltipRootContext';
import { useTooltipRoot } from './useTooltipRoot';

/**
 * The foundation for building custom-styled tooltips.
 *
 * Demos:
 *
 * - [Tooltip](https://mui.com/base-ui/react-tooltip/)
 *
 * API:
 *
 * - [TooltipRoot API](https://mui.com/base-ui/react-tooltip/components-api/#tooltip-root)
 */
function TooltipRoot(props: TooltipRootProps) {
  const {
    delayType = 'rest',
    delay = 200,
    closeDelay = 0,
    hoverable = true,
    followCursorAxis = 'none',
  } = props;

  const [triggerEl, setTriggerEl] = React.useState<Element | null>(null);
  const [popupEl, setPopupEl] = React.useState<HTMLElement | null>(null);

  const {
    open,
    setOpen,
    mounted,
    setMounted,
    instantType,
    getTriggerProps,
    getRootPopupProps,
    rootContext,
    transitionStatus,
  } = useTooltipRoot({
    popupEl,
    triggerEl,
    hoverable,
    followCursorAxis,
    delay,
    delayType,
    closeDelay,
    open: props.open,
    onOpenChange: props.onOpenChange,
    defaultOpen: props.defaultOpen,
  });

  const contextValue = React.useMemo(
    () => ({
      delay,
      delayType,
      closeDelay,
      open,
      setOpen,
      triggerEl,
      setTriggerEl,
      popupEl,
      setPopupEl,
      mounted,
      setMounted,
      instantType,
      getTriggerProps,
      getRootPopupProps,
      rootContext,
      followCursorAxis,
      transitionStatus,
    }),
    [
      delay,
      delayType,
      closeDelay,
      open,
      setOpen,
      triggerEl,
      popupEl,
      mounted,
      setMounted,
      instantType,
      getTriggerProps,
      getRootPopupProps,
      rootContext,
      followCursorAxis,
      transitionStatus,
    ],
  );

  return (
    <TooltipRootContext.Provider value={contextValue}>{props.children}</TooltipRootContext.Provider>
  );
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
   * The delay in milliseconds until the tooltip content is closed.
   * @default 0
   */
  closeDelay: PropTypes.number,
  /**
   * Specifies whether the tooltip is open initially when uncontrolled.
   */
  defaultOpen: PropTypes.bool,
  /**
   * The delay in milliseconds until the tooltip content is opened.
   * @default 200
   */
  delay: PropTypes.number,
  /**
   * The delay type to use. `rest` means the `delay` represents how long the user's cursor must
   * rest on the trigger before the tooltip content is opened. `hover` means the `delay` represents
   * how long to wait once the user's cursor has entered the trigger.
   * @default 'rest'
   */
  delayType: PropTypes.oneOf(['hover', 'rest']),
  /**
   * Determines which axis the tooltip should follow the cursor on.
   * @default 'none'
   */
  followCursorAxis: PropTypes.oneOf(['both', 'none', 'x', 'y']),
  /**
   * Whether you can move from the trigger to the tooltip without it closing.
   * @default true
   */
  hoverable: PropTypes.bool,
  /**
   * Callback fired when the tooltip content is requested to be opened or closed. Use when
   * controlled.
   */
  onOpenChange: PropTypes.func,
  /**
   * If `true`, the tooltip content is open. Use when controlled.
   */
  open: PropTypes.bool,
} as any;

export { TooltipRoot };
