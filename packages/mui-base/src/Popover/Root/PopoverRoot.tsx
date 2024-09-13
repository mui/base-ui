'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { PopoverRootContext } from './PopoverRootContext';
import { usePopoverRoot } from './usePopoverRoot';
import { OPEN_DELAY } from '../utils/constants';

/**
 * The foundation for building custom-styled popovers.
 *
 * Demos:
 *
 * - [Popover](https://base-ui.netlify.app/components/react-popover/)
 *
 * API:
 *
 * - [PopoverRoot API](https://base-ui.netlify.app/components/react-popover/#api-reference-PopoverRoot)
 */
function PopoverRoot(props: PopoverRoot.Props) {
  const { openOnHover = false, delayType = 'rest', delay, closeDelay = 0, animated = true } = props;

  const delayWithDefault = delay ?? OPEN_DELAY;

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
    transitionStatus,
    floatingRootContext,
    getRootTriggerProps,
    getRootPopupProps,
    titleId,
    setTitleId,
    descriptionId,
    setDescriptionId,
  } = usePopoverRoot({
    openOnHover,
    delay: delayWithDefault,
    delayType,
    closeDelay,
    animated,
    open: props.open,
    onOpenChange: props.onOpenChange,
    defaultOpen: props.defaultOpen,
  });

  const contextValue: PopoverRootContext = React.useMemo(
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
      popupRef,
      mounted,
      setMounted,
      instantType,
      transitionStatus,
      titleId,
      setTitleId,
      descriptionId,
      setDescriptionId,
      floatingRootContext,
      getRootPopupProps,
      getRootTriggerProps,
    }),
    [
      openOnHover,
      delayWithDefault,
      delayType,
      closeDelay,
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
      transitionStatus,
      titleId,
      setTitleId,
      descriptionId,
      setDescriptionId,
      floatingRootContext,
      getRootPopupProps,
      getRootTriggerProps,
    ],
  );

  return (
    <PopoverRootContext.Provider value={contextValue}>{props.children}</PopoverRootContext.Provider>
  );
}

namespace PopoverRoot {
  export interface OwnerState {}
  export interface Props extends Omit<usePopoverRoot.Parameters, 'floatingRootContext'> {
    children?: React.ReactNode;
  }
}

PopoverRoot.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * Whether the popover can animate, adding animation-related attributes and allowing for exit
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
   * Whether the popover popup is open by default. Use when uncontrolled.
   * @default false
   */
  defaultOpen: PropTypes.bool,
  /**
   * The delay in milliseconds until the popover popup is opened when `openOnHover` is `true`.
   * @default 300
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
   * Callback fired when the popover popup is requested to be opened or closed. Use when
   * controlled.
   */
  onOpenChange: PropTypes.func,
  /**
   * Whether the popover popup is open. Use when controlled.
   * @default false
   */
  open: PropTypes.bool,
  /**
   * Whether the popover popup opens when the trigger is hovered after the provided `delay`.
   * @default false
   */
  openOnHover: PropTypes.bool,
} as any;

export { PopoverRoot };
