import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {
  safePolygon,
  useClientPoint,
  useDelayGroup,
  useDismiss,
  useFloatingRootContext,
  useFocus,
  useHover,
  useInteractions,
  type FloatingRootContext,
} from '@floating-ui/react';
import { useControlled } from '../../utils/useControlled';
import { useTransitionStatus } from '../../utils/useTransitionStatus';
import { useEventCallback } from '../../utils/useEventCallback';
import { OPEN_DELAY } from '../utils/constants';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import type { GenericHTMLProps } from '../../utils/types';
import {
  translateOpenChangeReason,
  type OpenChangeReason,
} from '../../utils/translateOpenChangeReason';
import { useAfterExitAnimation } from '../../utils/useAfterExitAnimation';

export function useTooltipRoot(params: useTooltipRoot.Parameters): useTooltipRoot.ReturnValue {
  const {
    open: externalOpen,
    onOpenChange: onOpenChangeProp,
    defaultOpen = false,
    hoverable = true,
    trackCursorAxis = 'none',
    delay,
    closeDelay,
  } = params;

  const delayWithDefault = delay ?? OPEN_DELAY;
  const closeDelayWithDefault = closeDelay ?? 0;

  const [triggerElement, setTriggerElement] = React.useState<Element | null>(null);
  const [positionerElement, setPositionerElement] = React.useState<HTMLElement | null>(null);
  const [instantTypeState, setInstantTypeState] = React.useState<'dismiss' | 'focus'>();

  const popupRef = React.useRef<HTMLElement>(null);

  const [open, setOpenUnwrapped] = useControlled({
    controlled: externalOpen,
    default: defaultOpen,
    name: 'Tooltip',
    state: 'open',
  });

  const onOpenChange = useEventCallback(onOpenChangeProp);

  const setOpen = React.useCallback(
    (nextOpen: boolean, event?: Event, reason?: OpenChangeReason) => {
      onOpenChange(nextOpen, event, reason);
      setOpenUnwrapped(nextOpen);
    },
    [onOpenChange, setOpenUnwrapped],
  );

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);

  useAfterExitAnimation({
    open,
    animatedElementRef: popupRef,
    onFinished() {
      setMounted(false);
    },
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

      if (isHover) {
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

  const { delay: groupDelay, isInstantPhase, currentId } = useDelayGroup(context);
  const openGroupDelay = typeof groupDelay === 'object' ? groupDelay.open : groupDelay;
  const closeGroupDelay = typeof groupDelay === 'object' ? groupDelay.close : groupDelay;

  let instantType = isInstantPhase ? ('delay' as const) : instantTypeState;
  if (!open && context.floatingId === currentId) {
    instantType = instantTypeState;
  }

  const computedRestMs = openGroupDelay || delayWithDefault;
  let computedCloseDelay: number | undefined = closeDelayWithDefault;

  // A provider is present and the close delay is not set.
  if (closeDelay == null && groupDelay !== 0) {
    computedCloseDelay = closeGroupDelay;
  }

  const hover = useHover(context, {
    mouseOnly: true,
    move: false,
    handleClose: hoverable && trackCursorAxis !== 'both' ? safePolygon() : null,
    restMs: computedRestMs,
    delay: {
      close: computedCloseDelay,
    },
  });
  const focus = useFocus(context);
  const dismiss = useDismiss(context, { referencePress: true });
  const clientPoint = useClientPoint(context, {
    enabled: trackCursorAxis !== 'none',
    axis: trackCursorAxis === 'none' ? undefined : trackCursorAxis,
  });

  const { getReferenceProps: getRootTriggerProps, getFloatingProps: getRootPopupProps } =
    useInteractions([hover, focus, dismiss, clientPoint]);

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
      positionerElement,
      setOpen,
      getRootTriggerProps,
      getRootPopupProps,
      context,
      instantType,
      transitionStatus,
    ],
  );
}

export namespace useTooltipRoot {
  export interface Parameters {
    /**
     * Whether the tooltip is initially open.
     *
     * To render a controlled tooltip, use the `open` prop instead.
     * @default false
     */
    defaultOpen?: boolean;
    /**
     * Whether the tooltip is currently open.
     */
    open?: boolean;
    /**
     * Event handler called when the tooltip is opened or closed.
     */
    onOpenChange?: (open: boolean, event?: Event, reason?: OpenChangeReason) => void;
    /**
     * Whether the tooltip contents can be hovered without closing the tooltip.
     * @default true
     */
    hoverable?: boolean;
    /**
     * Determines which axis the tooltip should track the cursor on.
     * @default 'none'
     */
    trackCursorAxis?: 'none' | 'x' | 'y' | 'both';
    /**
     * How long to wait before opening the tooltip. Specified in milliseconds.
     * @default 600
     */
    delay?: number;
    /**
     * How long to wait before closing the tooltip. Specified in milliseconds.
     * @default 0
     */
    closeDelay?: number;
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
    positionerElement: HTMLElement | null;
    setTriggerElement: React.Dispatch<React.SetStateAction<Element | null>>;
    setPositionerElement: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
    popupRef: React.RefObject<HTMLElement | null>;
  }
}
