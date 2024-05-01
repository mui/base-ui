'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { PopoverRootProps } from './PopoverRoot.types';
import { PopoverContext } from './PopoverRootContext';
import { usePopoverRoot } from './usePopoverRoot';
import { PopoverRootContextValue } from './PopoverRoot.types';
import { OPEN_DELAY } from '../utils/constants';

/**
 * The foundation for building custom-styled popovers.
 *
 * Demos:
 *
 * - [Popover](https://mui.com/base-ui/react-popover/)
 *
 * API:
 *
 * - [PopoverRoot API](https://mui.com/base-ui/react-popover/components-api/#popover-root)
 */
function PopoverRoot(props: PopoverRootProps) {
  const { openOnHover = false, delayType = 'rest', delay, closeDelay = 0, animated = true } = props;

  const [triggerElement, setTriggerElement] = React.useState<Element | null>(null);
  const [positionerElement, setPositionerElement] = React.useState<HTMLElement | null>(null);

  const delayWithDefault = delay ?? OPEN_DELAY;

  const {
    open,
    setOpen,
    mounted,
    setMounted,
    instantType,
    transitionStatus,
    rootContext,
    getTriggerProps,
    getPopupProps,
    getTitleProps,
    getCloseProps,
    titleId,
    setTitleId,
    descriptionId,
    setDescriptionId,
  } = usePopoverRoot({
    openOnHover,
    positionerElement,
    triggerElement,
    delay: delayWithDefault,
    delayType,
    closeDelay,
    animated,
    open: props.open,
    onOpenChange: props.onOpenChange,
    defaultOpen: props.defaultOpen,
  });

  const contextValue: PopoverRootContextValue = React.useMemo(
    () => ({
      openOnHover,
      delay: delayWithDefault,
      delayType,
      closeDelay,
      open,
      setOpen,
      triggerElement,
      setTriggerElement,
      positionerElement,
      setPositionerElement,
      mounted,
      setMounted,
      instantType,
      transitionStatus,
      titleId,
      setTitleId,
      descriptionId,
      setDescriptionId,
      rootContext,
      getPopupProps,
      getTriggerProps,
      getTitleProps,
      getCloseProps,
    }),
    [
      openOnHover,
      delayWithDefault,
      delayType,
      closeDelay,
      open,
      setOpen,
      triggerElement,
      positionerElement,
      mounted,
      setMounted,
      instantType,
      transitionStatus,
      titleId,
      setTitleId,
      descriptionId,
      setDescriptionId,
      rootContext,
      getPopupProps,
      getTriggerProps,
      getTitleProps,
      getCloseProps,
    ],
  );

  return <PopoverContext.Provider value={contextValue}>{props.children}</PopoverContext.Provider>;
}

PopoverRoot.propTypes /* remove-proptypes */ = {
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
   * The delay in milliseconds until the popover popup is closed when `openOnHover` is `true`.
   * @default 0
   */
  closeDelay: PropTypes.number,
  /**
   * Specifies whether the popover is open initially when uncontrolled.
   */
  defaultOpen: PropTypes.bool,
  /**
   * The delay in milliseconds until the popover popup is opened when `openOnHover` is `true`.
   * @default 500
   */
  delay: PropTypes.number,
  /**
   * The delay type to use when `openOnHover` is `true`. `rest` means the `delay` represents how
   * long the user's cursor must rest on the trigger before the popover popup is opened. `hover`
   * means the `delay` represents how long to wait as soon as the user's cursor has entered the
   * trigger.
   * @default 'rest'
   */
  delayType: PropTypes.oneOf(['hover', 'rest']),
  /**
   * Determines which axis the tooltip should follow the cursor on.
   * @default 'none'
   */
  followCursorAxis: PropTypes.oneOf(['none', 'x', 'y']),
  /**
   * Callback fired when the popover popup is requested to be opened or closed. Use when
   * controlled.
   */
  onOpenChange: PropTypes.func,
  /**
   * If `true`, the popover popup is open. Use when controlled.
   */
  open: PropTypes.bool,
  /**
   * If `true`, the popover popup opens when the trigger is hovered.
   * @default false
   */
  openOnHover: PropTypes.bool,
} as any;

export { PopoverRoot };
