'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useControlled } from '@base-ui-components/utils/useControlled';
import { useUntrackedCallback } from '@base-ui-components/utils/useUntrackedCallback';
import {
  safePolygon,
  useDismiss,
  useHover,
  useInteractions,
  useFloatingRootContext,
} from '../../floating-ui-react';
import { PreviewCardRootContext } from './PreviewCardContext';
import { CLOSE_DELAY, OPEN_DELAY } from '../utils/constants';
import type { BaseUIChangeEventDetails } from '../../utils/createBaseUIEventDetails';
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
    delay,
    closeDelay,
    onOpenChangeComplete,
    actionsRef,
  } = props;

  const delayWithDefault = delay ?? OPEN_DELAY;
  const closeDelayWithDefault = closeDelay ?? CLOSE_DELAY;

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

  const onOpenChange = useUntrackedCallback(onOpenChangeProp);

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);

  const handleUnmount = useUntrackedCallback(() => {
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

  const setOpen = useUntrackedCallback(
    (nextOpen: boolean, eventDetails: PreviewCardRoot.ChangeEventDetails) => {
      const isHover = eventDetails.reason === 'trigger-hover';
      const isFocusOpen = nextOpen && eventDetails.reason === 'trigger-focus';
      const isDismissClose =
        !nextOpen &&
        (eventDetails.reason === 'trigger-press' || eventDetails.reason === 'escape-key');

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
      } else if (eventDetails.reason === 'trigger-hover') {
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
  const computedRestMs = delayWithDefault;

  const hover = useHover(context, {
    mouseOnly: true,
    move: false,
    handleClose: safePolygon(),
    restMs: computedRestMs,
    delay: {
      close: closeDelayWithDefault,
    },
  });
  const focus = useFocusWithDelay(context, { delay: OPEN_DELAY });
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
      delay: delayWithDefault,
      closeDelay: closeDelayWithDefault,
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
      delayWithDefault,
      closeDelayWithDefault,
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
   * How long to wait before the preview card opens. Specified in milliseconds.
   * @default 600
   */
  delay?: number;
  /**
   * How long to wait before closing the preview card. Specified in milliseconds.
   * @default 300
   */
  closeDelay?: number;
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
  | 'trigger-hover'
  | 'trigger-focus'
  | 'trigger-press'
  | 'outside-press'
  | 'escape-key'
  | 'none';

export type PreviewCardRootChangeEventDetails =
  BaseUIChangeEventDetails<PreviewCardRoot.ChangeEventReason>;

export namespace PreviewCardRoot {
  export type State = PreviewCardRootState;
  export type Props = PreviewCardRootProps;
  export type Actions = PreviewCardRootActions;
  export type ChangeEventReason = PreviewCardRootChangeEventReason;
  export type ChangeEventDetails = PreviewCardRootChangeEventDetails;
}
