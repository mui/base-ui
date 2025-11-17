'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui-components/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { useScrollLock } from '@base-ui-components/utils/useScrollLock';
import {
  useDismiss,
  useFloatingRootContext,
  useInteractions,
  useRole,
  FloatingTree,
  useFloatingParentNodeId,
} from '../../floating-ui-react';
import { useTransitionStatus } from '../../utils/useTransitionStatus';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { PopoverRootContext, usePopoverRootContext } from './PopoverRootContext';
import { PopoverStore } from '../store/PopoverStore';
import { PopoverHandle } from '../store/PopoverHandle';
import {
  createChangeEventDetails,
  type BaseUIChangeEventDetails,
} from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';
import { type PayloadChildRenderFunction } from '../../utils/popupStoreUtils';

function PopoverRootComponent<Payload>({ props }: { props: PopoverRoot.Props<Payload> }) {
  const {
    children,
    open: openProp,
    defaultOpen: defaultOpenProp = false,
    onOpenChange,
    onOpenChangeComplete,
    modal = false,
    handle,
    triggerId: triggerIdProp,
    defaultTriggerId: defaultTriggerIdProp = null,
  } = props;

  const store = PopoverStore.useStore(handle?.store, {
    open: openProp ?? defaultOpenProp,
    modal,
    activeTriggerId: triggerIdProp !== undefined ? triggerIdProp : defaultTriggerIdProp,
  });

  store.useControlledProp('open', openProp, defaultOpenProp);
  store.useControlledProp('activeTriggerId', triggerIdProp, defaultTriggerIdProp);

  const open = store.useState('open');
  const triggerElements = store.useState('triggers');
  const activeTriggerId = store.useState('activeTriggerId');
  const positionerElement = store.useState('positionerElement');
  const activeTriggerElement = store.useState('activeTriggerElement');
  const payload = store.useState('payload') as Payload | undefined;
  const openReason = store.useState('openReason');
  const openMethod = store.useState('openMethod');

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);

  let resolvedTriggerId: string | null = null;
  if (mounted === true && triggerIdProp === undefined && triggerElements.size === 1) {
    resolvedTriggerId = triggerElements.keys().next().value || null;
  } else {
    resolvedTriggerId = activeTriggerId ?? null;
  }

  store.useContextCallback('onOpenChange', onOpenChange);
  store.useContextCallback('onOpenChangeComplete', onOpenChangeComplete);

  useIsoLayoutEffect(() => {
    store.set('mounted', mounted);
    if (!mounted) {
      store.set('activeTriggerId', null);
    }
  }, [store, mounted]);

  useIsoLayoutEffect(() => {
    if (open) {
      store.set('activeTriggerId', resolvedTriggerId);
      if (resolvedTriggerId == null) {
        store.set('payload', undefined);
      }
    }
  }, [store, resolvedTriggerId, open]);

  useScrollLock(
    open && modal === true && openReason !== REASONS.triggerHover && openMethod !== 'touch',
    positionerElement,
  );

  React.useEffect(() => {
    if (!open) {
      store.context.stickIfOpenTimeout.clear();
    }
  }, [store, open]);

  const createPopoverEventDetails = React.useCallback(
    (reason: PopoverRoot.ChangeEventReason) => {
      const details: PopoverRoot.ChangeEventDetails =
        createChangeEventDetails<PopoverRoot.ChangeEventReason>(
          reason,
        ) as PopoverRoot.ChangeEventDetails;
      details.preventUnmountOnClose = () => {
        store.context.preventUnmountingRef.current = true;
      };

      return details;
    },
    [store],
  );

  const handleUnmount = useStableCallback(() => {
    setMounted(false);
    store.update({ stickIfOpen: true, openReason: null, activeTriggerId: null, mounted: false });
    onOpenChangeComplete?.(false);
  });

  const handleImperativeClose = React.useCallback(() => {
    store.setOpen(false, createPopoverEventDetails(REASONS.imperativeAction));
  }, [store, createPopoverEventDetails]);

  useOpenChangeComplete({
    enabled: !store.context.preventUnmountingRef.current,
    open,
    ref: store.context.popupRef,
    onComplete() {
      if (!open) {
        handleUnmount();
      }
    },
  });

  React.useImperativeHandle(
    props.actionsRef,
    () => ({ unmount: handleUnmount, close: handleImperativeClose }),
    [handleUnmount, handleImperativeClose],
  );

  const floatingContext = useFloatingRootContext({
    elements: {
      reference: activeTriggerElement,
      floating: positionerElement,
      triggers: Array.from(triggerElements.values()),
    },
    open,
    onOpenChange: store.setOpen,
  });

  const dismiss = useDismiss(floatingContext, {
    outsidePressEvent: {
      // Ensure `aria-hidden` on outside elements is removed immediately
      // on outside press when trapping focus.
      mouse: modal === 'trap-focus' ? 'sloppy' : 'intentional',
      touch: 'sloppy',
    },
  });
  const role = useRole(floatingContext);

  const { getReferenceProps, getFloatingProps, getTriggerProps } = useInteractions([dismiss, role]);

  store.useSyncedValues({
    transitionStatus,
    modal,
    activeTriggerProps: getReferenceProps(),
    inactiveTriggerProps: getTriggerProps(),
    popupProps: getFloatingProps(),
    floatingRootContext: floatingContext,
    nested: useFloatingParentNodeId() != null,
  });

  const popoverContext: PopoverRootContext<Payload> = React.useMemo(
    () => ({
      store,
    }),
    [store],
  );

  return (
    <PopoverRootContext.Provider value={popoverContext as PopoverRootContext<unknown>}>
      {typeof children === 'function' ? children({ payload }) : children}
    </PopoverRootContext.Provider>
  );
}

/**
 * Groups all parts of the popover.
 * Doesn’t render its own HTML element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
export function PopoverRoot<Payload = unknown>(props: PopoverRoot.Props<Payload>) {
  if (usePopoverRootContext(true)) {
    return <PopoverRootComponent props={props} />;
  }

  return (
    <FloatingTree>
      <PopoverRootComponent props={props} />
    </FloatingTree>
  );
}

export interface PopoverRootState {}

export interface PopoverRootProps<Payload = unknown> {
  /**
   * Whether the popover is initially open.
   *
   * To render a controlled popover, use the `open` prop instead.
   * @default false
   */
  defaultOpen?: boolean;
  /**
   * Whether the popover is currently open.
   */
  open?: boolean;
  /**
   * Event handler called when the popover is opened or closed.
   */
  onOpenChange?: (open: boolean, eventDetails: PopoverRoot.ChangeEventDetails) => void;
  /**
   * Event handler called after any animations complete when the popover is opened or closed.
   */
  onOpenChangeComplete?: (open: boolean) => void;
  /**
   * A ref to imperative actions.
   * - `unmount`: When specified, the popover will not be unmounted when closed.
   * Instead, the `unmount` function must be called to unmount the popover manually.
   * Useful when the popover's animation is controlled by an external library.
   */
  actionsRef?: React.RefObject<PopoverRoot.Actions | null>;
  /**
   * Determines if the popover enters a modal state when open.
   * - `true`: user interaction is limited to the popover: document page scroll is locked, and pointer interactions on outside elements are disabled.
   * - `false`: user interaction with the rest of the document is allowed.
   * - `'trap-focus'`: focus is trapped inside the popover, but document page scroll is not locked and pointer interactions outside of it remain enabled.
   * @default false
   */
  modal?: boolean | 'trap-focus';
  /**
   * ID of the trigger that the popover is associated with.
   * This is useful in conjuntion with the `open` prop to create a controlled popover.
   * There's no need to specify this prop when the popover is uncontrolled (i.e. when the `open` prop is not set).
   */
  triggerId?: string | null;
  /**
   * ID of the trigger that the popover is associated with.
   * This is useful in conjuntion with the `defaultOpen` prop to create an initially open popover.
   */
  defaultTriggerId?: string | null;
  /**
   * A handle to associate the popover with a trigger.
   * If specified, allows external triggers to control the popover's open state.
   */
  handle?: PopoverHandle<Payload>;
  /**
   * The content of the popover.
   * This can be a regular React node or a render function that receives the `payload` of the active trigger.
   */
  children?: React.ReactNode | PayloadChildRenderFunction<Payload>;
}

export interface PopoverRootActions {
  unmount: () => void;
  close: () => void;
}

export type PopoverRootChangeEventReason =
  | typeof REASONS.triggerHover
  | typeof REASONS.triggerFocus
  | typeof REASONS.triggerPress
  | typeof REASONS.outsidePress
  | typeof REASONS.escapeKey
  | typeof REASONS.closePress
  | typeof REASONS.focusOut
  | typeof REASONS.imperativeAction
  | typeof REASONS.none;
export type PopoverRootChangeEventDetails =
  BaseUIChangeEventDetails<PopoverRoot.ChangeEventReason> & {
    preventUnmountOnClose(): void;
  };

export namespace PopoverRoot {
  export type State = PopoverRootState;
  export type Props<Payload = unknown> = PopoverRootProps<Payload>;
  export type Actions = PopoverRootActions;
  export type ChangeEventReason = PopoverRootChangeEventReason;
  export type ChangeEventDetails = PopoverRootChangeEventDetails;
}
