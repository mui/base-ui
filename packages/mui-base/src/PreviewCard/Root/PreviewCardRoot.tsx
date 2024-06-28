'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { PreviewCardRootProps } from './PreviewCardRoot.types';
import { PreviewCardRootContext } from './PreviewCardContext';
import { usePreviewCardRoot } from './usePreviewCardRoot';

function PreviewCardRoot(props: PreviewCardRootProps) {
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
  } = usePreviewCardRoot({
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
    <PreviewCardRootContext.Provider value={contextValue}>
      {props.children}
    </PreviewCardRootContext.Provider>
  );
}

PreviewCardRoot.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * Whether the preview card can animate, adding animation-related attributes and allowing for exit
   * animations to play. Useful to disable in tests to remove async behavior.
   * @default true
   */
  animated: PropTypes.bool,
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * The delay in milliseconds until the preview card popup is closed.
   * @default 300
   */
  closeDelay: PropTypes.number,
  /**
   * Specifies whether the preview card is open initially when uncontrolled.
   */
  defaultOpen: PropTypes.bool,
  /**
   * The delay in milliseconds until the preview card popup is opened.
   * @default 400
   */
  delay: PropTypes.number,
  /**
   * The delay type to use. `rest` means the `delay` represents how long the user's cursor must
   * rest on the trigger before the preview card popup is opened. `hover` means the `delay` represents
   * how long to wait as soon as the user's cursor has entered the trigger.
   * @default 'rest'
   */
  delayType: PropTypes.oneOf(['hover', 'rest']),
  /**
   * Callback fired when the preview card popup is requested to be opened or closed. Use when
   * controlled.
   */
  onOpenChange: PropTypes.func,
  /**
   * If `true`, the preview card popup is open. Use when controlled.
   */
  open: PropTypes.bool,
} as any;

export { PreviewCardRoot };
