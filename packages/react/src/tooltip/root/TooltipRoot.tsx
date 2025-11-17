'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui-components/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { TooltipRootContext } from './TooltipRootContext';
import {
  useClientPoint,
  useDismiss,
  useFloatingRootContext,
  useFocus,
  useInteractions,
} from '../../floating-ui-react';
import { useTransitionStatus } from '../../utils/useTransitionStatus';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import {
  type BaseUIChangeEventDetails,
  createChangeEventDetails,
} from '../../utils/createBaseUIEventDetails';
import { type PayloadChildRenderFunction } from '../../utils/popupStoreUtils';
import { TooltipStore } from '../store/TooltipStore';
import { type TooltipHandle } from '../store/TooltipHandle';
import { REASONS } from '../../utils/reasons';

/**
 * Groups all parts of the tooltip.
 * Doesn’t render its own HTML element.
 *
 * Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
 */
export function TooltipRoot<Payload>(props: TooltipRoot.Props<Payload>) {
  const {
    disabled = false,
    defaultOpen = false,
    open: openProp,
    disableHoverablePopup = false,
    trackCursorAxis = 'none',
    actionsRef,
    onOpenChange,
    onOpenChangeComplete,
    handle,
    triggerId: triggerIdProp,
    defaultTriggerId: defaultTriggerIdProp = null,
    children,
  } = props;

  const store = TooltipStore.useStore<Payload>(handle?.store, {
    open: openProp ?? defaultOpen,
    activeTriggerId: triggerIdProp !== undefined ? triggerIdProp : defaultTriggerIdProp,
  });

  store.useControlledProp('open', openProp, defaultOpen);
  store.useControlledProp('activeTriggerId', triggerIdProp, defaultTriggerIdProp);

  store.useContextCallback('onOpenChange', onOpenChange);
  store.useContextCallback('onOpenChangeComplete', onOpenChangeComplete);

  const openState = store.useState('open');
  const activeTriggerElement = store.useState('activeTriggerElement');
  const positionerElement = store.useState('positionerElement');
  const instantType = store.useState('instantType');
  const lastOpenChangeReason = store.useState('lastOpenChangeReason');
  const triggerElements = store.useState('triggers');
  const activeTriggerId = store.useState('activeTriggerId');
  const payload = store.useState('payload') as Payload | undefined;
  const isInstantPhase = store.useState('isInstantPhase');
  const preventUnmountingOnClose = store.useState('preventUnmountingOnClose');

  const open = !disabled && openState;

  useIsoLayoutEffect(() => {
    if (openState && disabled) {
      store.setOpen(false, createChangeEventDetails(REASONS.disabled));
    }
  }, [openState, disabled, store]);

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);

  store.useSyncedValues({ mounted, transitionStatus, disabled });

  let resolvedTriggerId: string | null = null;
  if (mounted === true && triggerIdProp === undefined && triggerElements.size === 1) {
    resolvedTriggerId = triggerElements.keys().next().value || null;
  } else {
    resolvedTriggerId = triggerIdProp ?? activeTriggerId ?? null;
  }

  useIsoLayoutEffect(() => {
    if (open) {
      store.set('activeTriggerId', resolvedTriggerId);
      if (resolvedTriggerId == null) {
        store.set('payload', undefined);
      }
    }
  }, [store, resolvedTriggerId, open]);

  const handleUnmount = useStableCallback(() => {
    setMounted(false);
    store.update({ activeTriggerId: null, mounted: false });
    store.context.onOpenChangeComplete?.(false);
  });

  const createTooltipEventDetails = React.useCallback(
    (reason: TooltipRoot.ChangeEventReason) => {
      const details: TooltipRoot.ChangeEventDetails =
        createChangeEventDetails<TooltipRoot.ChangeEventReason>(
          reason,
        ) as TooltipRoot.ChangeEventDetails;
      details.preventUnmountOnClose = () => {
        store.set('preventUnmountingOnClose', true);
      };

      return details;
    },
    [store],
  );

  const handleImperativeClose = React.useCallback(() => {
    store.setOpen(false, createTooltipEventDetails(REASONS.imperativeAction));
  }, [store, createTooltipEventDetails]);

  useOpenChangeComplete({
    enabled: !preventUnmountingOnClose,
    open,
    ref: store.context.popupRef,
    onComplete() {
      if (!open) {
        handleUnmount();
      }
    },
  });

  React.useImperativeHandle(
    actionsRef,
    () => ({ unmount: handleUnmount, close: handleImperativeClose }),
    [handleUnmount, handleImperativeClose],
  );

  const floatingRootContext = useFloatingRootContext({
    elements: {
      reference: activeTriggerElement,
      floating: positionerElement,
      triggers: Array.from(triggerElements.values()),
    },
    open,
    onOpenChange: store.setOpen,
  });

  // Animations should be instant in two cases:
  // 1) Opening during the provider's instant phase (adjacent tooltip opens instantly)
  // 2) Closing because another tooltip opened (reason === 'none')
  // Otherwise, allow the animation to play. In particular, do not disable animations
  // during the 'ending' phase unless it's due to a sibling opening.
  const previousInstantTypeRef = React.useRef<string | undefined | null>(null);
  useIsoLayoutEffect(() => {
    if (
      (transitionStatus === 'ending' && lastOpenChangeReason === REASONS.none) ||
      (transitionStatus !== 'ending' && isInstantPhase)
    ) {
      // Capture the current instant type so we can restore it later
      // and set to 'delay' to disable animations while moving from one trigger to another
      // within a delay group.
      if (instantType !== 'delay') {
        previousInstantTypeRef.current = instantType;
      }
      store.set('instantType', 'delay');
    } else if (previousInstantTypeRef.current !== null) {
      store.set('instantType', previousInstantTypeRef.current);
      previousInstantTypeRef.current = null;
    }
  }, [transitionStatus, isInstantPhase, lastOpenChangeReason, instantType, store]);

  const focus = useFocus(floatingRootContext, { enabled: !disabled });
  const dismiss = useDismiss(floatingRootContext, { enabled: !disabled, referencePress: true });
  const clientPoint = useClientPoint(floatingRootContext, {
    enabled: !disabled && trackCursorAxis !== 'none',
    axis: trackCursorAxis === 'none' ? undefined : trackCursorAxis,
  });

  const { getReferenceProps, getFloatingProps, getTriggerProps } = useInteractions([
    focus,
    dismiss,
    clientPoint,
  ]);

  store.useSyncedValues({
    trackCursorAxis,
    disableHoverablePopup,
    floatingRootContext,
    activeTriggerProps: getReferenceProps(),
    inactiveTriggerProps: getTriggerProps(),
    popupProps: getFloatingProps(),
  });

  const contextValue: TooltipRootContext<Payload> = React.useMemo(
    () => ({
      store,
    }),
    [store],
  );

  return (
    <TooltipRootContext.Provider value={contextValue as TooltipRootContext}>
      {typeof children === 'function' ? children({ payload }) : children}
    </TooltipRootContext.Provider>
  );
}

export interface TooltipRootState {}

export interface TooltipRootProps<Payload = unknown> {
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
  onOpenChange?: (open: boolean, eventDetails: TooltipRoot.ChangeEventDetails) => void;
  /**
   * Event handler called after any animations complete when the tooltip is opened or closed.
   */
  onOpenChangeComplete?: (open: boolean) => void;
  /**
   * Whether the tooltip contents can be hovered without closing the tooltip.
   * @default false
   */
  disableHoverablePopup?: boolean;
  /**
   * Determines which axis the tooltip should track the cursor on.
   * @default 'none'
   */
  trackCursorAxis?: 'none' | 'x' | 'y' | 'both';
  /**
   * A ref to imperative actions.
   * - `unmount`: When specified, the tooltip will not be unmounted when closed.
   * Instead, the `unmount` function must be called to unmount the tooltip manually.
   * Useful when the tooltip's animation is controlled by an external library.
   */
  actionsRef?: React.RefObject<TooltipRoot.Actions>;
  /**
   * Whether the tooltip is disabled.
   * @default false
   */
  disabled?: boolean;
  /**
   * A handle to associate the tooltip with a trigger.
   * If specified, allows external triggers to control the tooltip's open state.
   * Can be created with the Tooltip.createHandle() method.
   */
  handle?: TooltipHandle<Payload>;
  /**
   * The content of the tooltip.
   * This can be a regular React node or a render function that receives the `payload` of the active trigger.
   */
  children?: React.ReactNode | PayloadChildRenderFunction<Payload>;
  /**
   * ID of the trigger that the tooltip is associated with.
   * This is useful in conjuntion with the `open` prop to create a controlled tooltip.
   * There's no need to specify this prop when the tooltip is uncontrolled (i.e. when the `open` prop is not set).
   */
  triggerId?: string | null;
  /**
   * ID of the trigger that the tooltip is associated with.
   * This is useful in conjunction with the `defaultOpen` prop to create an initially open tooltip.
   */
  defaultTriggerId?: string | null;
}

export interface TooltipRootActions {
  unmount: () => void;
}

export type TooltipRootChangeEventReason =
  | typeof REASONS.triggerHover
  | typeof REASONS.triggerFocus
  | typeof REASONS.triggerPress
  | typeof REASONS.outsidePress
  | typeof REASONS.escapeKey
  | typeof REASONS.disabled
  | typeof REASONS.imperativeAction
  | typeof REASONS.none;

export type TooltipRootChangeEventDetails =
  BaseUIChangeEventDetails<TooltipRoot.ChangeEventReason> & {
    preventUnmountOnClose(): void;
  };

export namespace TooltipRoot {
  export type State = TooltipRootState;
  export type Props<Payload = unknown> = TooltipRootProps<Payload>;
  export type Actions = TooltipRootActions;
  export type ChangeEventReason = TooltipRootChangeEventReason;
  export type ChangeEventDetails = TooltipRootChangeEventDetails;
}
