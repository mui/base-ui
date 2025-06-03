'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {
  safePolygon,
  useDismiss,
  useHover,
  useInteractions,
  useFloatingRootContext,
} from '@floating-ui/react';
import { PreviewCardRootContext } from './PreviewCardContext';
import { CLOSE_DELAY, OPEN_DELAY } from '../utils/constants';
import {
  translateOpenChangeReason,
  type BaseOpenChangeReason,
} from '../../utils/translateOpenChangeReason';
import { useFocusWithDelay } from '../../utils/floating-ui/useFocusWithDelay';
import { useControlled } from '../../utils/useControlled';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useEventCallback } from '../../utils/useEventCallback';
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

  const onOpenChange = useEventCallback(onOpenChangeProp);

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);

  const handleUnmount = useEventCallback(() => {
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

  const setOpen = useEventCallback(
    (nextOpen: boolean, event: Event | undefined, reason: BaseOpenChangeReason | undefined) => {
      const isHover = reason === 'trigger-hover';
      const isFocusOpen = nextOpen && reason === 'trigger-focus';
      const isDismissClose = !nextOpen && (reason === 'trigger-press' || reason === 'escape-key');

      function changeState() {
        onOpenChange(nextOpen, event, reason);
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
      } else if (reason === 'trigger-hover') {
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
    onOpenChange(openValue, eventValue, reasonValue) {
      setOpen(openValue, eventValue, translateOpenChangeReason(reasonValue));
    },
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

export namespace PreviewCardRoot {
  export interface State {}

  export interface Props {
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
     * @type (open: boolean, event?: Event, reason?: PreviewCard.Root.OpenChangeReason) => void
     */
    onOpenChange?: (
      open: boolean,
      event: Event | undefined,
      reason: OpenChangeReason | undefined,
    ) => void;
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
    actionsRef?: React.RefObject<Actions>;
  }

  export interface Actions {
    unmount: () => void;
  }

  export type OpenChangeReason = BaseOpenChangeReason;
}
