'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import useEventCallback from '@mui/utils/useEventCallback';
import {
  safePolygon,
  useDelayGroup,
  useDismiss,
  useFloatingRootContext,
  useHover,
  useInteractions,
  type OpenChangeReason,
} from '@floating-ui/react';
import type {
  UseHoverCardRootParameters,
  UseHoverCardRootReturnValue,
} from './useHoverCardRoot.types';
import { useControlled } from '../../utils/useControlled';
import { useTransitionStatus } from '../../utils/useTransitionStatus';
import { useAnimationsFinished } from '../../utils/useAnimationsFinished';

/**
 * Manages the root state for a hover card.
 *
 * API:
 *
 * - [useHoverCardRoot API](https://mui.com/base-ui/api/use-hover-card-root/)
 */
export function useHoverCardRoot(params: UseHoverCardRootParameters): UseHoverCardRootReturnValue {
  const {
    open: externalOpen,
    onOpenChange: onOpenChangeProp = () => {},
    defaultOpen = false,
    keepMounted = false,
    triggerElement = null,
    positionerElement = null,
    animated = true,
    delayType = 'rest',
    delay,
    closeDelay,
  } = params;

  const delayWithDefault = delay ?? 400;
  const closeDelayWithDefault = closeDelay ?? 300;

  const [instantTypeState, setInstantTypeState] = React.useState<'dismiss' | 'focus'>();

  const [open, setOpenUnwrapped] = useControlled({
    controlled: externalOpen,
    default: defaultOpen,
    name: 'HoverCard',
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

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open, animated);

  const runOnceAnimationsFinish = useAnimationsFinished(() => positionerElement?.firstElementChild);

  const context = useFloatingRootContext({
    elements: { reference: triggerElement, floating: positionerElement },
    open,
    onOpenChange(openValue, eventValue, reasonValue) {
      const isHover = reasonValue === 'hover' || reasonValue === 'safe-polygon';
      const isFocusOpen = openValue && reasonValue === 'focus';
      const isDismissClose =
        !openValue && (reasonValue === 'reference-press' || reasonValue === 'escape-key');

      function changeState() {
        setOpen(openValue, eventValue, reasonValue);
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

      if (!keepMounted && !openValue) {
        if (animated) {
          runOnceAnimationsFinish(() => setMounted(false));
        } else {
          setMounted(false);
        }
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

  const computedRestMs = delayType === 'rest' ? openGroupDelay || delayWithDefault : undefined;
  let computedOpenDelay: number | undefined = delayType === 'hover' ? delayWithDefault : undefined;
  let computedCloseDelay: number | undefined = closeDelayWithDefault;

  if (delayType === 'hover') {
    if (delay == null) {
      computedOpenDelay =
        groupDelay === 0
          ? // A provider is not present.
            delayWithDefault
          : // A provider is present.
            openGroupDelay;
    } else {
      computedOpenDelay = delay;
    }
  }

  // A provider is present and the close delay is not set.
  if (closeDelay == null && groupDelay !== 0) {
    computedCloseDelay = closeGroupDelay;
  }

  const hover = useHover(context, {
    mouseOnly: true,
    move: false,
    handleClose: safePolygon(),
    restMs: computedRestMs,
    delay: {
      open: computedOpenDelay,
      close: computedCloseDelay,
    },
  });
  const dismiss = useDismiss(context);

  const { getReferenceProps: getRootTriggerProps, getFloatingProps: getRootPopupProps } =
    useInteractions([hover, dismiss]);

  return React.useMemo(
    () => ({
      open,
      setOpen,
      mounted,
      setMounted,
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
      getRootTriggerProps,
      getRootPopupProps,
      context,
      instantType,
      transitionStatus,
    ],
  );
}
