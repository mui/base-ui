import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {
  safePolygon,
  useDismiss,
  useFloatingRootContext,
  useHover,
  useInteractions,
  type FloatingRootContext,
} from '@floating-ui/react';
import { useControlled } from '../../utils/useControlled';
import { useTransitionStatus } from '../../utils/useTransitionStatus';
import { useEventCallback } from '../../utils/useEventCallback';
import { useFocusExtended } from '../utils/useFocusExtended';
import { OPEN_DELAY, CLOSE_DELAY } from '../utils/constants';
import type { GenericHTMLProps } from '../../utils/types';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import {
  translateOpenChangeReason,
  type OpenChangeReason,
} from '../../utils/translateOpenChangeReason';
import { useAfterExitAnimation } from '../../utils/useAfterCloseAnimation';

export function usePreviewCardRoot(
  params: usePreviewCardRoot.Parameters,
): usePreviewCardRoot.ReturnValue {
  const {
    open: externalOpen,
    onOpenChange: onOpenChangeProp = () => {},
    defaultOpen = false,
    animated = true,
    delay,
    closeDelay,
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

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open, animated);

  const setOpen = useEventCallback(
    (nextOpen: boolean, event?: Event, reason?: OpenChangeReason) => {
      onOpenChange(nextOpen, event, reason);
      setOpenUnwrapped(nextOpen);
    },
  );

  useAfterExitAnimation({
    open,
    animated,
    animatedElementRef: popupRef,
    onFinished: () => setMounted(false),
  });

  const context = useFloatingRootContext({
    elements: { reference: triggerElement, floating: positionerElement },
    open,
    onOpenChange(openValue, eventValue, reasonValue) {
      const isHover = reasonValue === 'hover' || reasonValue === 'safe-polygon';
      const isFocusOpen = openValue && reasonValue === 'focus';
      const isDismissClose =
        !openValue && (reasonValue === 'reference-press' || reasonValue === 'escape-key');

      function changeState() {
        setOpen(openValue, eventValue, translateOpenChangeReason(reasonValue));
      }

      if (animated && isHover) {
        // If a hover reason is provided, we need to flush the state synchronously. This ensures
        // `node.getAnimations()` knows about the new state.
        ReactDOM.flushSync(changeState);
      } else {
        changeState();
      }

      if (isFocusOpen || isDismissClose) {
        setInstantTypeState(isFocusOpen ? 'focus' : 'dismiss');
      } else if (reasonValue === 'hover') {
        setInstantTypeState(undefined);
      }
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
  const focus = useFocusExtended(context);
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
    ],
  );
}

export namespace usePreviewCardRoot {
  export interface Parameters {
    /**
     * Whether the preview card popup is open by default. Use when uncontrolled.
     * @default false
     */
    defaultOpen?: boolean;
    /**
     * Whether the preview card popup is open. Use when controlled.
     * @default false
     */
    open?: boolean;
    /**
     * Callback fired when the preview card popup is requested to be opened or closed. Use when
     * controlled.
     */
    onOpenChange?: (open: boolean, event?: Event, reason?: OpenChangeReason) => void;
    /**
     * Whether the preview card popup opens when the trigger is hovered after the provided `delay`.
     * @default false
     */
    openOnHover?: boolean;
    /**
     * The delay in milliseconds until the preview card popup is opened when `openOnHover` is `true`.
     * @default 600
     */
    delay?: number;
    /**
     * The delay in milliseconds until the preview card popup is closed when `openOnHover` is `true`.
     * @default 300
     */
    closeDelay?: number;
    /**
     * Whether the preview card can animate, adding animation-related attributes and allowing for exit
     * animations to play. Useful to disable in tests to remove async behavior.
     * @default true
     */
    animated?: boolean;
  }

  export interface ReturnValue {
    open: boolean;
    setOpen: (value: boolean, event?: Event, reason?: OpenChangeReason) => void;
    mounted: boolean;
    setMounted: React.Dispatch<React.SetStateAction<boolean>>;
    getRootTriggerProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
    getRootPopupProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
    floatingRootContext: FloatingRootContext;
    instantType: 'delay' | 'dismiss' | 'focus' | undefined;
    transitionStatus: TransitionStatus;
    setTriggerElement: React.Dispatch<React.SetStateAction<Element | null>>;
    positionerElement: HTMLElement | null;
    setPositionerElement: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
    popupRef: React.RefObject<HTMLDivElement | null>;
  }
}
