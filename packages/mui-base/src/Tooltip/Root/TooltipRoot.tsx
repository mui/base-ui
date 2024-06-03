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
    delay,
    closeDelay,
    hoverable = true,
    animated = true,
    followCursorAxis = 'none',
  } = props;

  const delayWithDefault = delay ?? 300;
  const closeDelayWithDefault = closeDelay ?? 0;

  const [triggerElement, setTriggerElement] = React.useState<Element | null>(null);
  const [popupElement, setPopupElement] = React.useState<HTMLElement | null>(null);

  const {
    open,
    setOpen,
    mounted,
    setMounted,
    instantType,
    getTriggerProps,
    getRootPositionerProps,
    rootContext,
    transitionStatus,
  } = useTooltipRoot({
    popupElement,
    triggerElement,
    hoverable,
    animated,
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
      delay: delayWithDefault,
      delayType,
      closeDelay: closeDelayWithDefault,
      open,
      setOpen,
      triggerElement,
      setTriggerElement,
      popupElement,
      setPopupElement,
      mounted,
      setMounted,
      instantType,
      getTriggerProps,
      getRootPositionerProps,
      rootContext,
      followCursorAxis,
      transitionStatus,
    }),
    [
      delayWithDefault,
      delayType,
      closeDelayWithDefault,
      open,
      setOpen,
      triggerElement,
      popupElement,
      mounted,
      setMounted,
      instantType,
      getTriggerProps,
      getRootPositionerProps,
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
   * Specifies whether the tooltip is open initially when uncontrolled.
   */
  defaultOpen: PropTypes.bool,
  /**
   * The delay in milliseconds until the tooltip popup is opened.
   * @default 300
   */
  delay: PropTypes.number,
  /**
   * The delay type to use. `rest` means the `delay` represents how long the user's cursor must
   * rest on the trigger before the tooltip popup is opened. `hover` means the `delay` represents
   * how long to wait as soon as the user's cursor has entered the trigger.
   * @default 'rest'
   */
  delayType: PropTypes.oneOf(['hover', 'rest']),
  /**
   * Determines which axis the tooltip should follow the cursor on.
   * @default 'none'
   */
  followCursorAxis: PropTypes.oneOf(['both', 'none', 'x', 'y']),
  /**
   * Whether the user can move their cursor from the trigger to the tooltip popup without it
   * closing.
   * @default true
   */
  hoverable: PropTypes.bool,
  /**
   * Callback fired when the tooltip popup is requested to be opened or closed. Use when
   * controlled.
   */
  onOpenChange: PropTypes.func,
  /**
   * If `true`, the tooltip popup is open. Use when controlled.
   */
  open: PropTypes.bool,
} as any;

export { TooltipRoot };
