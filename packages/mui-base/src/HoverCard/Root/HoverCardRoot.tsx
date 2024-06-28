'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { HoverCardRootProps } from './HoverCardRoot.types';
import { HoverCardRootContext } from './HoverCardContext';
import { useHoverCardRoot } from './useHoverCardRoot';

function HoverCardRoot(props: HoverCardRootProps) {
  const { delayType = 'rest', delay, closeDelay, animated = true } = props;

  const delayWithDefault = delay ?? 400;
  const closeDelayWithDefault = closeDelay ?? 250;

  const [triggerElement, setTriggerElement] = React.useState<Element | null>(null);
  const [positionerElement, setPositionerElement] = React.useState<HTMLElement | null>(null);

  const {
    open,
    setOpen,
    mounted,
    setMounted,
    instantType,
    getRootTriggerProps,
    getRootPopupProps,
    floatingRootContext,
    transitionStatus,
  } = useHoverCardRoot({
    positionerElement,
    triggerElement,
    animated,
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
      positionerElement,
      setPositionerElement,
      mounted,
      setMounted,
      instantType,
      getRootTriggerProps,
      getRootPopupProps,
      floatingRootContext,
      transitionStatus,
    }),
    [
      delayWithDefault,
      delayType,
      closeDelayWithDefault,
      open,
      setOpen,
      triggerElement,
      positionerElement,
      mounted,
      setMounted,
      instantType,
      getRootTriggerProps,
      getRootPopupProps,
      floatingRootContext,
      transitionStatus,
    ],
  );

  return (
    <HoverCardRootContext.Provider value={contextValue}>
      {props.children}
    </HoverCardRootContext.Provider>
  );
}

HoverCardRoot.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * Whether the hover card can animate, adding animation-related attributes and allowing for exit
   * animations to play. Useful to disable in tests to remove async behavior.
   * @default true
   */
  animated: PropTypes.bool,
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * The delay in milliseconds until the hover card popup is closed.
   * @default 300
   */
  closeDelay: PropTypes.number,
  /**
   * Specifies whether the hover card is open initially when uncontrolled.
   */
  defaultOpen: PropTypes.bool,
  /**
   * The delay in milliseconds until the hover card popup is opened.
   * @default 400
   */
  delay: PropTypes.number,
  /**
   * The delay type to use. `rest` means the `delay` represents how long the user's cursor must
   * rest on the trigger before the hover card popup is opened. `hover` means the `delay` represents
   * how long to wait as soon as the user's cursor has entered the trigger.
   * @default 'rest'
   */
  delayType: PropTypes.oneOf(['hover', 'rest']),
  /**
   * Callback fired when the hover card popup is requested to be opened or closed. Use when
   * controlled.
   */
  onOpenChange: PropTypes.func,
  /**
   * If `true`, the hover card popup is open. Use when controlled.
   */
  open: PropTypes.bool,
} as any;

export { HoverCardRoot };
