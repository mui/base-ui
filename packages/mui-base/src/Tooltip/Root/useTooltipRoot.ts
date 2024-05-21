import * as React from 'react';
import useEventCallback from '@mui/utils/useEventCallback';
import {
  safePolygon,
  useClientPoint,
  useDelayGroup,
  useDismiss,
  useFloatingRootContext,
  useFocus,
  useHover,
  useInteractions,
  type OpenChangeReason,
} from '@floating-ui/react';
import type { UseTooltipRootParameters, UseTooltipRootReturnValue } from './useTooltipRoot.types';
import { useControlled } from '../../utils/useControlled';
import { useTransitionStatus } from '../../useTransitionStatus';
import { ownerWindow } from '../../utils/owner';

/**
 * Manages the root state for a tooltip.
 *
 * Demos:
 *
 * - [Tooltip](https://mui.com/base-ui/react-tooltip/#hooks)
 *
 * API:
 *
 * - [useTooltipRoot API](https://mui.com/base-ui/react-tooltip/hooks-api/#use-tooltip-root)
 */
export function useTooltipRoot(params: UseTooltipRootParameters): UseTooltipRootReturnValue {
  const {
    open: externalOpen,
    onOpenChange: onOpenChangeProp = () => {},
    defaultOpen = false,
    keepMounted = false,
    triggerEl = null,
    popupEl = null,
    hoverable = true,
    followCursorAxis = 'none',
    delayType = 'rest',
    delay = 200,
    closeDelay = 0,
  } = params;

  const [instantTypeState, setInstantTypeState] = React.useState<'dismiss' | 'focus'>();

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

  const { mounted, setMounted } = useTransitionStatus(open);

  const context = useFloatingRootContext({
    elements: { reference: triggerEl, floating: popupEl },
    open,
    onOpenChange(openValue, eventValue, reasonValue) {
      const isFocusOpen = openValue && reasonValue === 'focus';
      const isDismissClose =
        !openValue && (reasonValue === 'reference-press' || reasonValue === 'escape-key');

      if (isFocusOpen || isDismissClose) {
        setInstantTypeState(isFocusOpen ? 'focus' : 'dismiss');
      } else if (reasonValue === 'hover') {
        setInstantTypeState(undefined);
      }

      const popupElement = popupEl?.firstElementChild;

      if (!keepMounted && !openValue && popupElement && setMounted) {
        // Wait for the CSS styles to be applied to determine if the animation has been removed in
        // the [data-instant] state. This allows the close animation to play if the `delay`
        // instantType is applying to the same element.
        requestAnimationFrame(() => {
          const computedStyles = ownerWindow(popupElement).getComputedStyle(popupElement);
          const hasNoAnimation =
            ['', 'none'].includes(computedStyles.animationName) ||
            ['', '0s'].includes(computedStyles.animationDuration);
          if (hasNoAnimation) {
            setMounted(false);
          }
        });
      }

      setOpen(openValue, eventValue, reasonValue);
    },
  });

  const { delay: groupDelay, isInstantPhase, currentId } = useDelayGroup(context);

  let instantType = isInstantPhase ? ('delay' as const) : instantTypeState;
  if (!open && context.floatingId === currentId) {
    instantType = instantTypeState;
  }

  const hover = useHover(context, {
    mouseOnly: true,
    move: false,
    handleClose: hoverable && followCursorAxis !== 'both' ? safePolygon() : null,
    restMs: delayType === 'rest' ? delay : undefined,
    delay: groupDelay || {
      open: delayType === 'hover' ? delay : 0,
      close: closeDelay,
    },
  });
  const focus = useFocus(context);
  const dismiss = useDismiss(context, { referencePress: true });
  const clientPoint = useClientPoint(context, {
    enabled: followCursorAxis !== 'none',
    axis: followCursorAxis === 'none' ? undefined : followCursorAxis,
  });

  const { getReferenceProps: getTriggerProps, getFloatingProps: getRootPopupProps } =
    useInteractions([hover, focus, dismiss, clientPoint]);

  return React.useMemo(
    () => ({
      open,
      setOpen,
      mounted,
      setMounted,
      getTriggerProps,
      getRootPopupProps,
      rootContext: context,
      instantType,
    }),
    [mounted, open, setMounted, setOpen, getTriggerProps, getRootPopupProps, context, instantType],
  );
}
