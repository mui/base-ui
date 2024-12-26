'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { PreviewCardRootContext } from './PreviewCardContext';
import { usePreviewCardRoot } from './usePreviewCardRoot';
import { CLOSE_DELAY, OPEN_DELAY } from '../utils/constants';
import { PortalContext } from '../../portal/PortalContext';

/**
 * Groups all parts of the preview card.
 * Doesn’t render its own HTML element.
 *
 * Documentation: [Base UI Preview Card](https://base-ui.com/react/components/preview-card)
 */
const PreviewCardRoot: React.FC<PreviewCardRoot.Props> = function PreviewCardRoot(props) {
  const { delay, closeDelay, onClosed } = props;

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
    onClosed,
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
      <PortalContext.Provider value={mounted}>{props.children}</PortalContext.Provider>
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
   * How long to wait before closing the preview card. Specified in milliseconds.
   * @default 300
   */
  closeDelay: PropTypes.number,
  /**
   * Whether the preview card is initially open.
   *
   * To render a controlled preview card, use the `open` prop instead.
   * @default false
   */
  defaultOpen: PropTypes.bool,
  /**
   * How long to wait before the preview card opens. Specified in milliseconds.
   * @default 600
   */
  delay: PropTypes.number,
  /**
   * Event handler called when the preview card is opened or closed.
   */
  onOpenChange: PropTypes.func,
  /**
   * Whether the preview card is currently open.
   */
  open: PropTypes.bool,
} as any;

export { PreviewCardRoot };
