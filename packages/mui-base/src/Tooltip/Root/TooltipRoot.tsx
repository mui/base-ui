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
  const { open, setOpen, mounted, setMounted, transitionStatus } = useTooltipRoot({
    open: props.open,
    onOpenChange: props.onOpenChange,
    defaultOpen: props.defaultOpen,
  });

  const { delay = 200, delayType = 'rest', closeDelay = 0 } = props;

  const [triggerEl, setTriggerEl] = React.useState<Element | null>(null);
  const [triggerProps, setTriggerProps] = React.useState<React.HTMLProps<Element>>({
    // Anchor props are set only once hydration has occurred, so we provide initial values for SSR.
    // Props that only make sense once hydration has occurred (indicating interactivity will work)
    // are ignored.
    ['data-state' as string]: 'closed',
  });

  const contextValue = React.useMemo(
    () => ({
      delay,
      delayType,
      closeDelay,
      open,
      setOpen,
      triggerEl,
      triggerProps,
      setTriggerEl,
      setTriggerProps,
      mounted,
      setMounted,
      transitionStatus,
    }),
    [
      delay,
      delayType,
      closeDelay,
      open,
      setOpen,
      triggerEl,
      triggerProps,
      mounted,
      setMounted,
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
