import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {
  safePolygon,
  useClick,
  useDelayGroup,
  useDismiss,
  useFloatingRootContext,
  useHover,
  useInteractions,
  useRole,
  type OpenChangeReason,
} from '@floating-ui/react';
import type { UsePopoverRootParameters, UsePopoverRootReturnValue } from './usePopoverRoot.types';
import { useControlled } from '../../utils/useControlled';
import { useEventCallback } from '../../utils/useEventCallback';
import { useTransitionStatus } from '../../utils/useTransitionStatus';
import { useAnimationsFinished } from '../../utils/useAnimationsFinished';
import { OPEN_DELAY } from '../utils/constants';

/**
 *
 * API:
 *
 * - [usePopoverRoot API](https://mui.com/base-ui/api/use-popover-root/)
 */
export function usePopoverRoot(params: UsePopoverRootParameters): UsePopoverRootReturnValue {
  const {
    open: externalOpen,
    onOpenChange: onOpenChangeProp = () => {},
    defaultOpen = false,
    keepMounted = false,
    triggerElement = null,
    positionerElement = null,
    delayType = 'rest',
    delay,
    closeDelay,
    openOnHover = false,
    animated = true,
  } = params;

  const delayWithDefault = delay ?? OPEN_DELAY;
  const closeDelayWithDefault = closeDelay ?? 0;

  const [instantTypeState, setInstantTypeState] = React.useState<'dismiss' | 'focus'>();
  const [titleId, setTitleId] = React.useState<string>();
  const [descriptionId, setDescriptionId] = React.useState<string>();

  const [open, setOpenUnwrapped] = useControlled({
    controlled: externalOpen,
    default: defaultOpen,
    name: 'Popover',
    state: 'open',
  });

  const onOpenChange = useEventCallback(onOpenChangeProp);

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);

  const runOnceAnimationsFinish = useAnimationsFinished(() => positionerElement?.firstElementChild);

  const setOpen = useEventCallback(
    (nextOpen: boolean, event?: Event, reason?: OpenChangeReason) => {
      onOpenChange(nextOpen, event, reason);
      setOpenUnwrapped(nextOpen);
      if (!keepMounted && !nextOpen) {
        if (animated) {
          runOnceAnimationsFinish(() => setMounted(false));
        } else {
          setMounted(false);
        }
      }
    },
  );

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
        ReactDOM.flushSync(changeState);
      } else {
        changeState();
      }

      if (isFocusOpen || isDismissClose) {
        setInstantTypeState(isFocusOpen ? 'focus' : 'dismiss');
      } else {
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
    enabled: openOnHover,
    mouseOnly: true,
    move: false,
    handleClose: safePolygon(),
    restMs: computedRestMs,
    delay: {
      open: computedOpenDelay,
      close: computedCloseDelay,
    },
  });
  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([hover, click, dismiss, role]);

  return React.useMemo(
    () => ({
      open,
      setOpen,
      mounted,
      setMounted,
      transitionStatus,
      titleId,
      setTitleId,
      descriptionId,
      setDescriptionId,
      getRootTriggerProps: getReferenceProps,
      getRootPopupProps: getFloatingProps,
      rootContext: context,
      instantType,
    }),
    [
      mounted,
      open,
      setMounted,
      setOpen,
      transitionStatus,
      titleId,
      descriptionId,
      getReferenceProps,
      getFloatingProps,
      context,
      instantType,
    ],
  );
}
