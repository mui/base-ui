'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { TooltipOpenChangeReason, TooltipRootContext } from './TooltipRootContext';
import {
  useClientPoint,
  useDelayGroup,
  useDismiss,
  useFloatingRootContext,
  useFocus,
  useHover,
  useInteractions,
  safePolygon,
} from '../../floating-ui-react';
import { useControlled } from '../../utils/useControlled';
import { useTransitionStatus } from '../../utils/useTransitionStatus';
import { useEventCallback } from '../../utils/useEventCallback';
import { OPEN_DELAY } from '../utils/constants';
import { translateOpenChangeReason } from '../../utils/translateOpenChangeReason';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useTooltipProviderContext } from '../provider/TooltipProviderContext';

/**
 * Groups all parts of the tooltip.
 * Doesn’t render its own HTML element.
 *
 * Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
 */
export function TooltipRoot(props: TooltipRoot.Props) {
  const {
    disabled = false,
    defaultOpen = false,
    onOpenChange: onOpenChangeProp,
    open,
    delay,
    closeDelay,
    hoverable = true,
    trackCursorAxis = 'none',
    actionsRef,
    onOpenChangeComplete,
  } = props;

  const delayWithDefault = delay ?? OPEN_DELAY;
  const closeDelayWithDefault = closeDelay ?? 0;

  const [triggerElement, setTriggerElement] = React.useState<Element | null>(null);
  const [positionerElement, setPositionerElement] = React.useState<HTMLElement | null>(null);
  const [instantTypeState, setInstantTypeState] = React.useState<'dismiss' | 'focus'>();

  const popupRef = React.useRef<HTMLElement>(null);

  const [openState, setOpenUnwrapped] = useControlled({
    controlled: open,
    default: defaultOpen,
    name: 'Tooltip',
    state: 'open',
  });

  const onOpenChange = useEventCallback(onOpenChangeProp);

  const setOpen = useEventCallback(
    (nextOpen: boolean, event: Event | undefined, reason: TooltipOpenChangeReason | undefined) => {
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

  if (openState && disabled) {
    setOpen(false, undefined, 'disabled');
  }

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(openState);

  const handleUnmount = useEventCallback(() => {
    setMounted(false);
    onOpenChangeComplete?.(false);
  });

  useOpenChangeComplete({
    enabled: !actionsRef,
    open: openState,
    ref: popupRef,
    onComplete() {
      if (!openState) {
        handleUnmount();
      }
    },
  });

  React.useImperativeHandle(actionsRef, () => ({ unmount: handleUnmount }), [handleUnmount]);

  const floatingRootContext = useFloatingRootContext({
    elements: {
      reference: triggerElement,
      floating: positionerElement,
    },
    open: openState,
    onOpenChange(openValue, eventValue, reasonValue) {
      setOpen(openValue, eventValue, translateOpenChangeReason(reasonValue));
    },
  });

  const providerContext = useTooltipProviderContext();
  const { delayRef, isInstantPhase, hasProvider } = useDelayGroup(floatingRootContext);

  const instantType = isInstantPhase ? ('delay' as const) : instantTypeState;

  const hover = useHover(floatingRootContext, {
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
      if (closeDelay == null && hasProvider) {
        computedCloseDelay = closeValue;
      }

      return {
        close: computedCloseDelay,
      };
    },
  });

  const focus = useFocus(floatingRootContext, { enabled: !disabled });
  const dismiss = useDismiss(floatingRootContext, { enabled: !disabled, referencePress: true });
  const clientPoint = useClientPoint(floatingRootContext, {
    enabled: !disabled && trackCursorAxis !== 'none',
    axis: trackCursorAxis === 'none' ? undefined : trackCursorAxis,
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    clientPoint,
  ]);

  const tooltipRoot = React.useMemo(
    () => ({
      open: openState,
      setOpen,
      mounted,
      setMounted,
      setTriggerElement,
      positionerElement,
      setPositionerElement,
      popupRef,
      triggerProps: getReferenceProps(),
      popupProps: getFloatingProps(),
      floatingRootContext,
      instantType,
      transitionStatus,
      onOpenChangeComplete,
    }),
    [
      openState,
      setOpen,
      mounted,
      setMounted,
      setTriggerElement,
      positionerElement,
      setPositionerElement,
      popupRef,
      getReferenceProps,
      getFloatingProps,
      floatingRootContext,
      instantType,
      transitionStatus,
      onOpenChangeComplete,
    ],
  );

  const contextValue: TooltipRootContext = React.useMemo(
    () => ({
      ...tooltipRoot,
      delay: delayWithDefault,
      closeDelay: closeDelayWithDefault,
      trackCursorAxis,
      hoverable,
    }),
    [tooltipRoot, delayWithDefault, closeDelayWithDefault, trackCursorAxis, hoverable],
  );

  return (
    <TooltipRootContext.Provider value={contextValue}>{props.children}</TooltipRootContext.Provider>
  );
}

export namespace TooltipRoot {
  export interface State {}

  export interface Props {
    children?: React.ReactNode;
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
     * @type (open: boolean, event?: Event, reason?: Tooltip.Root.OpenChangeReason) => void
     */
    onOpenChange?: (
      open: boolean,
      event: Event | undefined,
      reason: TooltipOpenChangeReason | undefined,
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

  export interface Actions {
    unmount: () => void;
  }

  export type OpenChangeReason = TooltipOpenChangeReason;
}
