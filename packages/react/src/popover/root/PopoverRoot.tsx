'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { PopoverRootContext } from './PopoverRootContext';
import { usePopoverRoot } from './usePopoverRoot';
import { OPEN_DELAY } from '../utils/constants';
import { PortalContext } from '../../portal/PortalContext';

/**
 * Groups all parts of the popover.
 * Doesn’t render its own HTML element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
const PopoverRoot: React.FC<PopoverRoot.Props> = function PopoverRoot(props) {
  const { openOnHover = false, modal = true, delay, closeDelay = 0 } = props;

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
    modal,
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
      modal,
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
      modal,
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
   * How long to wait before closing the popover that was opened on hover.
   * Specified in milliseconds.
   *
   * Requires the `openOnHover` prop.
   * @default 0
   */
  closeDelay: PropTypes.number,
  /**
   * Whether the popover is initially open.
   *
   * To render a controlled popover, use the `open` prop instead.
   * @default false
   */
  defaultOpen: PropTypes.bool,
  /**
   * How long to wait before the popover may be opened on hover. Specified in milliseconds.
   *
   * Requires the `openOnHover` prop.
   * @default 300
   */
  delay: PropTypes.number,
  /**
   * Whether the popover should prevent interactivity of other elements
   * on the page when open and the anchor is visible.
   * @default true
   */
  modal: PropTypes.bool,
  /**
   * Event handler called when the popover is opened or closed.
   */
  onOpenChange: PropTypes.func,
  /**
   * Whether the popover is currently open.
   */
  open: PropTypes.bool,
  /**
   * Whether the popover should also open when the trigger is hovered.
   * @default false
   */
  openOnHover: PropTypes.bool,
} as any;

export { PopoverRoot };
