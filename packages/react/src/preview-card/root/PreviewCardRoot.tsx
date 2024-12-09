'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { PreviewCardRootContext } from './PreviewCardContext';
import { usePreviewCardRoot } from './usePreviewCardRoot';
import { CLOSE_DELAY, OPEN_DELAY } from '../utils/constants';

/**
 */
const PreviewCardRoot: React.FC<PreviewCardRoot.Props> = function PreviewCardRoot(props) {
  const { delay, closeDelay } = props;

  const delayWithDefault = delay ?? OPEN_DELAY;
  const closeDelayWithDefault = closeDelay ?? CLOSE_DELAY;

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
  } = usePreviewCardRoot({
    delay,
    closeDelay,
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
      transitionStatus,
    ],
  );

  return (
    <PreviewCardRootContext.Provider value={contextValue}>
      {props.children}
    </PreviewCardRootContext.Provider>
  );
};

namespace PreviewCardRoot {
  export interface State {}

  export interface Props extends usePreviewCardRoot.Parameters {
    children?: React.ReactNode;
  }
}

PreviewCardRoot.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * The delay in milliseconds until the preview card popup is closed when `openOnHover` is `true`.
   * @default 300
   */
  closeDelay: PropTypes.number,
  /**
   * Whether the preview card popup is open by default. Use when uncontrolled.
   * @default false
   */
  defaultOpen: PropTypes.bool,
  /**
   * The delay in milliseconds until the preview card popup is opened when `openOnHover` is `true`.
   * @default 600
   */
  delay: PropTypes.number,
  /**
   * Callback fired when the preview card popup is requested to be opened or closed. Use when
   * controlled.
   */
  onOpenChange: PropTypes.func,
  /**
   * Whether the preview card popup is open. Use when controlled.
   * @default false
   */
  open: PropTypes.bool,
} as any;

export { PreviewCardRoot };
