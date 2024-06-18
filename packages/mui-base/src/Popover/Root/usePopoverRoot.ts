import * as React from 'react';
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
import { mergeReactProps } from '../../utils/mergeReactProps';
import { OPEN_DELAY } from '../utils/constants';

/**
 * Manages the root state for a popover.
 *
 * Demos:
 *
 * - [Popover](https://mui.com/base-ui/react-popover/#hooks)
 *
 * API:
 *
 * - [usePopoverRoot API](https://mui.com/base-ui/react-popover/hooks-api/#use-popover-root)
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

  const runOnceAnimationsFinish = useAnimationsFinished(() => positionerElement?.firstElementChild);

  const context = useFloatingRootContext({
    elements: { reference: triggerElement, floating: positionerElement },
    open,
    onOpenChange(openValue, eventValue, reasonValue) {
      const isFocusOpen = openValue && reasonValue === 'focus';
      const isDismissClose =
        !openValue && (reasonValue === 'reference-press' || reasonValue === 'escape-key');

      if (isFocusOpen || isDismissClose) {
        setInstantTypeState(isFocusOpen ? 'focus' : 'dismiss');
      } else {
        setInstantTypeState(undefined);
      }

      if (!keepMounted && !openValue) {
        if (animated) {
          runOnceAnimationsFinish(() => setMounted(false));
        } else {
          setMounted(false);
        }
      }

      setOpen(openValue, eventValue, reasonValue);
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

  const { getReferenceProps: getTriggerProps, getFloatingProps } = useInteractions([
    hover,
    click,
    dismiss,
    role,
  ]);

  const getPopupProps = React.useCallback(
    (externalProps = {}) => {
      return mergeReactProps<'div'>(getFloatingProps(externalProps), {
        'aria-labelledby': titleId,
        'aria-describedby': descriptionId,
        style: {
          // <Popover.Arrow> must be relative to the inner popup element.
          position: 'relative',
        },
      });
    },
    [titleId, descriptionId, getFloatingProps],
  );

  const getTitleProps = React.useCallback(
    (externalProps = {}) => {
      return mergeReactProps<'h2'>(externalProps, {
        id: titleId,
      });
    },
    [titleId],
  );

  const getDescriptionProps = React.useCallback(
    (externalProps = {}) => {
      return mergeReactProps<'p'>(externalProps, {
        id: descriptionId,
      });
    },
    [descriptionId],
  );

  const getCloseProps = React.useCallback(
    (externalProps = {}) => {
      return mergeReactProps<'button'>(externalProps, {
        onClick() {
          setOpen(false);
        },
      });
    },
    [setOpen],
  );

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
      getTriggerProps,
      getPopupProps,
      getTitleProps,
      getDescriptionProps,
      getCloseProps,
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
      getTriggerProps,
      getPopupProps,
      getTitleProps,
      getDescriptionProps,
      getCloseProps,
      context,
      instantType,
    ],
  );
}
