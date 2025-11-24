'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useControlled } from '@base-ui-components/utils/useControlled';
import { useStableCallback } from '@base-ui-components/utils/useStableCallback';
import {
  safePolygon,
  useDismiss,
  useHover,
  useInteractions,
  useFloatingRootContext,
} from '../../floating-ui-react';
import { PreviewCardRootContext, type PreviewCardTriggerDelayConfig } from './PreviewCardContext';
import { CLOSE_DELAY, OPEN_DELAY } from '../utils/constants';
import { type BaseUIChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';
import { useFocusWithDelay } from '../../utils/interactions/useFocusWithDelay';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useTransitionStatus } from '../../utils/useTransitionStatus';

/**
 * Groups all parts of the preview card.
 * Doesn’t render its own HTML element.
 *
 * Documentation: [Base UI Preview Card](https://base-ui.com/react/components/preview-card)
 */
export function PreviewCardRoot(props: PreviewCardRoot.Props) {
  const {
    open: externalOpen,
    defaultOpen,
    onOpenChange: onOpenChangeProp,
    onOpenChangeComplete,
    actionsRef,
  } = props;

  const delayRef = React.useRef(OPEN_DELAY);
  const closeDelayRef = React.useRef(CLOSE_DELAY);

  const writeDelayRefs = useStableCallback((config: PreviewCardTriggerDelayConfig) => {
    delayRef.current = config.delay ?? OPEN_DELAY;
    closeDelayRef.current = config.closeDelay ?? CLOSE_DELAY;
  });

  const [triggerElement, setTriggerElement] = React.useState<Element | null>(null);
  const [positionerElement, setPositionerElement] = React.useState<HTMLElement | null>(null);
  const [instantTypeState, setInstantTypeState] = React.useState<'dismiss' | 'focus'>();

  const popupRef = React.useRef<HTMLDivElement | null>(null);

  const [open, setOpenUnwrapped] = useControlled({
    controlled: externalOpen,
    default: defaultOpen,
    name: 'PreviewCard',
    state: 'open',
  });

  const onOpenChange = useStableCallback(onOpenChangeProp);

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);

  const handleUnmount = useStableCallback(() => {
    setMounted(false);
    onOpenChangeComplete?.(false);
  });

  useOpenChangeComplete({
    enabled: !actionsRef,
    open,
    ref: popupRef,
    onComplete() {
      if (!open) {
        handleUnmount();
      }
    },
  });

  React.useImperativeHandle(actionsRef, () => ({ unmount: handleUnmount }), [handleUnmount]);

  const setOpen = useStableCallback(
    (nextOpen: boolean, eventDetails: PreviewCardRoot.ChangeEventDetails) => {
      const isHover = eventDetails.reason === REASONS.triggerHover;
      const isFocusOpen = nextOpen && eventDetails.reason === REASONS.triggerFocus;
      const isDismissClose =
        !nextOpen &&
        (eventDetails.reason === REASONS.triggerPress || eventDetails.reason === REASONS.escapeKey);

      onOpenChange(nextOpen, eventDetails);

      if (eventDetails.isCanceled) {
        return;
      }

      function changeState() {
        setOpenUnwrapped(nextOpen);
      }

      if (isHover) {
        // If a hover reason is provided, we need to flush the state synchronously. This ensures
        // `node.getAnimations()` knows about the new state.
        ReactDOM.flushSync(changeState);
      } else {
        changeState();
      }

      if (isFocusOpen || isDismissClose) {
        setInstantTypeState(isFocusOpen ? 'focus' : 'dismiss');
      } else if (eventDetails.reason === REASONS.triggerHover) {
        setInstantTypeState(undefined);
      }
    },
  );

  const context = useFloatingRootContext({
    elements: {
      reference: triggerElement,
      floating: positionerElement,
    },
    open,
    onOpenChange: setOpen,
  });

  const instantType = instantTypeState;

  const getDelayValue = () => delayRef.current;
  const getCloseDelayValue = () => closeDelayRef.current;

  const hover = useHover(context, {
    mouseOnly: true,
    move: false,
    handleClose: safePolygon(),
    restMs: getDelayValue,
    delay: () => ({ close: getCloseDelayValue() }),
  });
  const focus = useFocusWithDelay(context, { delay: getDelayValue });
  const dismiss = useDismiss(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([hover, focus, dismiss]);

  const contextValue = React.useMemo(
    () => ({
      open,
      setOpen,
      mounted,
      setMounted,
      setTriggerElement,
      positionerElement,
      setPositionerElement,
      popupRef,
      triggerProps: getReferenceProps(),
      popupProps: getFloatingProps(),
      floatingRootContext: context,
      instantType,
      transitionStatus,
      onOpenChangeComplete,
      writeDelayRefs,
    }),
    [
      open,
      setOpen,
      mounted,
      setMounted,
      positionerElement,
      getReferenceProps,
      getFloatingProps,
      context,
      instantType,
      transitionStatus,
      onOpenChangeComplete,
      writeDelayRefs,
    ],
  );

  return (
    <PreviewCardRootContext.Provider value={contextValue}>
      {props.children}
    </PreviewCardRootContext.Provider>
  );
}

export interface PreviewCardRootState {}

export interface PreviewCardRootProps {
  children?: React.ReactNode;
  /**
   * Whether the preview card is initially open.
   *
   * To render a controlled preview card, use the `open` prop instead.
   * @default false
   */
  defaultOpen?: boolean;
  /**
   * Whether the preview card is currently open.
   */
  open?: boolean;
  /**
   * Event handler called when the preview card is opened or closed.
   */
  onOpenChange?: (open: boolean, eventDetails: PreviewCardRoot.ChangeEventDetails) => void;
  /**
   * Event handler called after any animations complete when the preview card is opened or closed.
   */
  onOpenChangeComplete?: (open: boolean) => void;
  /**
   * A ref to imperative actions.
   * - `unmount`: When specified, the preview card will not be unmounted when closed.
   * Instead, the `unmount` function must be called to unmount the preview card manually.
   * Useful when the preview card's animation is controlled by an external library.
   */
  actionsRef?: React.RefObject<PreviewCardRoot.Actions>;
}

export interface PreviewCardRootActions {
  unmount: () => void;
}

export type PreviewCardRootChangeEventReason =
  | typeof REASONS.triggerHover
  | typeof REASONS.triggerFocus
  | typeof REASONS.triggerPress
  | typeof REASONS.outsidePress
  | typeof REASONS.escapeKey
  | typeof REASONS.none;

export type PreviewCardRootChangeEventDetails =
  BaseUIChangeEventDetails<PreviewCardRoot.ChangeEventReason>;

export namespace PreviewCardRoot {
  export type State = PreviewCardRootState;
  export type Props = PreviewCardRootProps;
  export type Actions = PreviewCardRootActions;
  export type ChangeEventReason = PreviewCardRootChangeEventReason;
  export type ChangeEventDetails = PreviewCardRootChangeEventDetails;
}
