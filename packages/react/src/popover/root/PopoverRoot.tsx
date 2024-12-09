'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { PopoverRootContext } from './PopoverRootContext';
import { usePopoverRoot } from './usePopoverRoot';
import { OPEN_DELAY } from '../utils/constants';
import { PortalContext } from '../../portal/PortalContext';

/**
 * The foundation for building custom-styled popovers.
 *
 * Demos:
 *
 * - [Popover](https://base-ui.com/components/react-popover/)
 *
 * API:
 *
 * - [PopoverRoot API](https://base-ui.com/components/react-popover/#api-reference-PopoverRoot)
 */
const PopoverRoot: React.FC<PopoverRoot.Props> = function PopoverRoot(props) {
  const { openOnHover = false, delay, closeDelay = 0 } = props;

  const delayWithDefault = delay ?? OPEN_DELAY;

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
    transitionStatus,
    floatingRootContext,
    getRootTriggerProps,
    getRootPopupProps,
    titleId,
    setTitleId,
    descriptionId,
    setDescriptionId,
    openMethod,
    openReason,
  } = usePopoverRoot({
    openOnHover,
    delay: delayWithDefault,
    closeDelay,
    open: props.open,
    onOpenChange: props.onOpenChange,
    defaultOpen: props.defaultOpen,
  });

  const contextValue: PopoverRootContext = React.useMemo(
    () => ({
      openOnHover,
      delay: delayWithDefault,
      closeDelay,
      open,
      setOpen,
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
      openMethod,
      openReason,
    }),
    [
      openOnHover,
      delayWithDefault,
      closeDelay,
      open,
      setOpen,
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
      openMethod,
      openReason,
    ],
  );

  return (
    <PopoverRootContext.Provider value={contextValue}>
      <PortalContext.Provider value={mounted}>{props.children}</PortalContext.Provider>
    </PopoverRootContext.Provider>
  );
};

namespace PopoverRoot {
  export interface State {}

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
