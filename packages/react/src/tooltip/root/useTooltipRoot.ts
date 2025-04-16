import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {
  safePolygon,
  useClientPoint,
  useNextDelayGroup,
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
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useTooltipProviderContext } from '../provider/TooltipProviderContext';

export function useTooltipRoot(params: useTooltipRoot.Parameters): useTooltipRoot.ReturnValue {
  const {
    open: externalOpen,
    onOpenChange: onOpenChangeProp,
    defaultOpen = false,
    hoverable = true,
    trackCursorAxis = 'none',
    delay,
    closeDelay,
    onOpenChangeComplete,
    disabled,
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
    (nextOpen: boolean, event: Event | undefined, reason: OpenChangeReason | undefined) => {
      onOpenChange(nextOpen, event, reason);
      setOpenUnwrapped(nextOpen);
    },
    [onOpenChange, setOpenUnwrapped],
  );

  if (open && disabled) {
    setOpen(false, undefined, undefined);
  }

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

  const providerContext = useTooltipProviderContext();
  const { delayRef, isInstantPhase, hasProvider } = useNextDelayGroup(context);

  const instantType = isInstantPhase ? ('delay' as const) : instantTypeState;

  const hover = useHover(context, {
    enabled: !disabled,
    mouseOnly: true,
    move: false,
    handleClose: hoverable && trackCursorAxis !== 'both' ? safePolygon() : null,
    restMs() {
      const providerDelay = providerContext?.delay;
      const groupOpenValue =
        typeof delayRef.current === 'object' ? delayRef.current.open : undefined;

      let computedRestMs = delayWithDefault;
      if (hasProvider) {
        if (groupOpenValue !== 0) {
          computedRestMs = delay ?? providerDelay ?? delayWithDefault;
        } else {
          computedRestMs = 0;
        }
      }

      return computedRestMs;
    },
    delay() {
      const closeValue = typeof delayRef.current === 'object' ? delayRef.current.close : undefined;

      let computedCloseDelay: number | undefined = closeDelayWithDefault;
      // A provider is present and the close delay is not set.
      if (closeDelay == null && hasProvider) {
        computedCloseDelay = closeValue;
      }

      return {
        close: computedCloseDelay,
      };
    },
  });
  const focus = useFocus(context, { enabled: !disabled });
  const dismiss = useDismiss(context, { enabled: !disabled, referencePress: true });
  const clientPoint = useClientPoint(context, {
    enabled: !disabled && trackCursorAxis !== 'none',
    axis: trackCursorAxis === 'none' ? undefined : trackCursorAxis,
  });

  const { getReferenceProps: getTriggerProps, getFloatingProps: getPopupProps } = useInteractions([
    hover,
    focus,
    dismiss,
    clientPoint,
  ]);

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
      getTriggerProps,
      getPopupProps,
      floatingRootContext: context,
      instantType,
      transitionStatus,
      onOpenChangeComplete,
    }),
    [
      mounted,
      open,
      setMounted,
      positionerElement,
      setOpen,
      getTriggerProps,
      getPopupProps,
      context,
      instantType,
      transitionStatus,
      onOpenChangeComplete,
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
    onOpenChange?: (
      open: boolean,
      event: Event | undefined,
      reason: OpenChangeReason | undefined,
    ) => void;
    /**
     * Event handler called after any animations complete when the tooltip is opened or closed.
     */
    onOpenChangeComplete?: (open: boolean) => void;
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
    /**
     * A ref to imperative actions.
     * - `unmount`: When specified, the tooltip will not be unmounted when closed.
     * Instead, the `unmount` function must be called to unmount the tooltip manually.
     * Useful when the tooltip's animation is controlled by an external library.
     */
    actionsRef?: React.RefObject<Actions>;
    /**
     * Whether the tooltip is disabled.
     * @default false
     */
    disabled?: boolean;
  }

  export interface ReturnValue {
    open: boolean;
    setOpen: (value: boolean, event?: Event, reason?: OpenChangeReason) => void;
    mounted: boolean;
    setMounted: React.Dispatch<React.SetStateAction<boolean>>;
    getTriggerProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
    getPopupProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
    floatingRootContext: FloatingRootContext;
    instantType: 'delay' | 'dismiss' | 'focus' | undefined;
    transitionStatus: TransitionStatus;
    positionerElement: HTMLElement | null;
    setTriggerElement: React.Dispatch<React.SetStateAction<Element | null>>;
    setPositionerElement: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
    popupRef: React.RefObject<HTMLElement | null>;
    onOpenChangeComplete: ((open: boolean) => void) | undefined;
  }

  export interface Actions {
    unmount: () => void;
  }
}
