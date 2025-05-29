import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {
  useDismiss,
  useFloatingRootContext,
  useHover,
  useInteractions,
  safePolygon,
  type FloatingRootContext,
} from '@floating-ui/react';
import { useControlled } from '../../utils/useControlled';
import { useTransitionStatus } from '../../utils/useTransitionStatus';
import { useEventCallback } from '../../utils/useEventCallback';
import { OPEN_DELAY, CLOSE_DELAY } from '../utils/constants';
import type { HTMLProps } from '../../utils/types';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import {
  translateOpenChangeReason,
  type BaseOpenChangeReason as OpenChangeReason,
} from '../../utils/translateOpenChangeReason';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useFocusWithDelay } from '../../utils/floating-ui/useFocusWithDelay';

export function usePreviewCardRoot(
  params: usePreviewCardRoot.Parameters,
): usePreviewCardRoot.ReturnValue {
  const {
    open: externalOpen,
    onOpenChange: onOpenChangeProp,
    defaultOpen = false,
    delay,
    closeDelay,
    onOpenChangeComplete,
  } = params;

  const delayWithDefault = delay ?? OPEN_DELAY;
  const closeDelayWithDefault = closeDelay ?? CLOSE_DELAY;

  const [triggerElement, setTriggerElement] = React.useState<Element | null>(null);
  const [positionerElement, setPositionerElement] = React.useState<HTMLElement | null>(null);
  const [instantTypeState, setInstantTypeState] = React.useState<'dismiss' | 'focus'>();

  const popupRef = React.useRef<HTMLDivElement>(null);

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
    enabled: !params.actionsRef,
    open,
    ref: popupRef,
    onComplete() {
      if (!open) {
        handleUnmount();
      }
    },
  });

  React.useImperativeHandle(params.actionsRef, () => ({ unmount: handleUnmount }), [handleUnmount]);

  const setOpen = useEventCallback(
    (nextOpen: boolean, event: Event | undefined, reason: OpenChangeReason | undefined) => {
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

  const { getReferenceProps: getRootTriggerProps, getFloatingProps: getRootPopupProps } =
    useInteractions([hover, focus, dismiss]);

  return React.useMemo(
    () => ({
      open,
      setOpen,
      mounted,
      setMounted,
      setTriggerElement,
      positionerElement,
      setPositionerElement,
      popupRef,
      getRootTriggerProps,
      getRootPopupProps,
      floatingRootContext: context,
      instantType,
      transitionStatus,
      onOpenChangeComplete,
    }),
    [
      mounted,
      open,
      setMounted,
      setOpen,
      positionerElement,
      getRootTriggerProps,
      getRootPopupProps,
      context,
      instantType,
      transitionStatus,
      onOpenChangeComplete,
    ],
  );
}

export namespace usePreviewCardRoot {
  export interface Parameters {
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

  export interface ReturnValue {
    open: boolean;
    setOpen: (
      value: boolean,
      event: Event | undefined,
      reason: OpenChangeReason | undefined,
    ) => void;
    mounted: boolean;
    setMounted: React.Dispatch<React.SetStateAction<boolean>>;
    getRootTriggerProps: (externalProps?: HTMLProps) => HTMLProps;
    getRootPopupProps: (externalProps?: HTMLProps) => HTMLProps;
    floatingRootContext: FloatingRootContext;
    instantType: 'delay' | 'dismiss' | 'focus' | undefined;
    transitionStatus: TransitionStatus;
    setTriggerElement: React.Dispatch<React.SetStateAction<Element | null>>;
    positionerElement: HTMLElement | null;
    setPositionerElement: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
    popupRef: React.RefObject<HTMLDivElement | null>;
    onOpenChangeComplete: ((open: boolean) => void) | undefined;
  }

  export interface Actions {
    unmount: () => void;
  }
}
