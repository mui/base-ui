'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useTimeout } from '@base-ui-components/utils/useTimeout';
import { useUntrackedCallback } from '@base-ui-components/utils/useUntrackedCallback';
import { useRefWithInit } from '@base-ui-components/utils/useRefWithInit';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
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
import { PATIENT_CLICK_THRESHOLD } from '../../utils/constants';
import { useScrollLock } from '../../utils/useScrollLock';
import { PopoverRootContext, usePopoverRootContext } from './PopoverRootContext';
import { PopoverStore } from '../store';
import {
  createChangeEventDetails,
  type BaseUIChangeEventDetails,
} from '../../utils/createBaseUIEventDetails';
import type { FloatingUIOpenChangeDetails } from '../../utils/types';

function PopoverRootComponent<Payload>({ props }: { props: PopoverRoot.Props<Payload> }) {
  const {
    open: openProp,
    defaultOpen: defaultOpenProp = false,
    onOpenChange,
    onOpenChangeComplete,
    modal = false,
    handle,
    triggerId: triggerIdProp,
    defaultTriggerId: defaultTriggerIdProp = null,
  } = props;

  const nested = useFloatingParentNodeId() != null;

  let floatingEvents: ReturnType<typeof useFloatingRootContext>['events'];
  const store = useRefWithInit(() => {
    return (
      handle ||
      new PopoverStore<Payload>({
        open: openProp ?? defaultOpenProp,
        modal,
        activeTriggerId: triggerIdProp !== undefined ? triggerIdProp : defaultTriggerIdProp,
      })
    );
  }).current;

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
  const stickIfOpenTimeout = useTimeout();

  let resolvedTriggerId: string | null = null;
  if (mounted === true && triggerIdProp === undefined && triggerElements.size === 1) {
    resolvedTriggerId = triggerElements.keys().next().value || null;
  } else {
    resolvedTriggerId = activeTriggerId ?? null;
  }

  store.useContextCallback('onOpenChangeComplete', onOpenChangeComplete);

  useIsoLayoutEffect(() => {
    store.set('mounted', mounted);
    if (!mounted) {
      store.set('activeTriggerId', null);
    }
  }, [store, mounted]);

  useIsoLayoutEffect(() => {
    if (open) {
      if (resolvedTriggerId != null) {
        store.set('activeTriggerId', resolvedTriggerId);
        const triggerMetadata = triggerElements.get(resolvedTriggerId);
        store.set('payload', triggerMetadata?.getPayload?.() ?? undefined);
      } else {
        store.set('payload', undefined);
      }
    }
  }, [store, resolvedTriggerId, triggerElements, open]);

  useScrollLock({
    enabled: open && modal === true && openReason !== 'trigger-hover' && openMethod !== 'touch',
    mounted,
    open,
    referenceElement: positionerElement,
  });

  const preventUnmountingRef = React.useRef(false);

  React.useEffect(() => {
    if (!open) {
      stickIfOpenTimeout.clear();
    }
  }, [stickIfOpenTimeout, open]);

  function createPopoverEventDetails(reason: PopoverRoot.ChangeEventReason) {
    const details: PopoverRoot.ChangeEventDetails =
      createChangeEventDetails<PopoverRoot.ChangeEventReason>(
        reason,
      ) as PopoverRoot.ChangeEventDetails;
    details.preventUnmountOnClose = () => {
      preventUnmountingRef.current = true;
    };

    return details;
  }

  const setOpen = useUntrackedCallback(function setOpen(
    nextOpen: boolean,
    eventDetails: Omit<PopoverRoot.ChangeEventDetails, 'preventUnmountOnClose'>,
  ) {
    const isHover = eventDetails.reason === 'trigger-hover';
    const isKeyboardClick =
      eventDetails.reason === 'trigger-press' && (eventDetails.event as MouseEvent).detail === 0;
    const isDismissClose =
      !nextOpen && (eventDetails.reason === 'escape-key' || eventDetails.reason == null);

    (eventDetails as PopoverRoot.ChangeEventDetails).preventUnmountOnClose = () => {
      preventUnmountingRef.current = true;
    };

    onOpenChange?.(nextOpen, eventDetails as PopoverRoot.ChangeEventDetails);

    if (eventDetails.isCanceled) {
      return;
    }

    const details: FloatingUIOpenChangeDetails = {
      open: nextOpen,
      nativeEvent: eventDetails.event,
      reason: eventDetails.reason,
      nested,
      triggerElement: eventDetails.trigger,
    };

    floatingEvents?.emit('openchange', details);

    function changeState() {
      store.set('open', nextOpen);

      if (nextOpen) {
        store.set('openReason', eventDetails.reason ?? null);
      }

      // If a popup is closing, the `trigger` may be null.
      // We want to keep the previous value so that exit animations are played and focus is returned correctly.
      const newTriggerId = eventDetails.trigger?.id ?? null;
      if (newTriggerId || nextOpen) {
        store.set('activeTriggerId', newTriggerId);
      }
    }

    if (isHover) {
      // Only allow "patient" clicks to close the popover if it's open.
      // If they clicked within 500ms of the popover opening, keep it open.
      store.set('stickIfOpen', true);
      stickIfOpenTimeout.start(PATIENT_CLICK_THRESHOLD, () => {
        store.set('stickIfOpen', false);
      });

      ReactDOM.flushSync(changeState);
    } else {
      changeState();
    }

    if (isKeyboardClick || isDismissClose) {
      store.set('instantType', isKeyboardClick ? 'click' : 'dismiss');
    } else if (eventDetails.reason === 'focus-out') {
      store.set('instantType', 'focus');
    } else {
      store.set('instantType', undefined);
    }
  });

  const handleUnmount = useUntrackedCallback(() => {
    setMounted(false);
    store.apply({ stickIfOpen: true, openReason: null, activeTriggerId: null, mounted: false });
    onOpenChangeComplete?.(false);
  });

  const handleImperativeClose = React.useCallback(() => {
    setOpen(false, createPopoverEventDetails('imperative-action'));
  }, [setOpen]);

  useOpenChangeComplete({
    enabled: !preventUnmountingRef.current,
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
      triggers: Array.from(triggerElements.values()).map(
        (triggerMetadata) => triggerMetadata.element,
      ),
    },
    open,
    onOpenChange: setOpen,
  });

  floatingEvents = floatingContext.events;

  React.useEffect(() => {
    const handleSetOpenEvent = ({
      open: nextOpen,
      eventDetails,
    }: {
      open: boolean;
      eventDetails: Omit<PopoverRoot.ChangeEventDetails, 'preventUnmountOnClose'>;
    }) => setOpen(nextOpen, eventDetails);

    floatingEvents.on('setOpen', handleSetOpenEvent);

    return () => {
      floatingEvents?.off('setOpen', handleSetOpenEvent);
    };
  }, [floatingEvents, setOpen]);

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
  });

  const popoverContext: PopoverRootContext = React.useMemo(
    () => ({
      store,
    }),
    [store],
  );

  return (
    <PopoverRootContext.Provider value={popoverContext}>
      {typeof props.children === 'function' ? props.children({ payload }) : props.children}
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
  handle?: PopoverStore<Payload>;
  /**
   * The content of the popover.
   * This can be a regular React node or a render function that receives the `payload` of the active trigger.
   */
  children?: React.ReactNode | PopoverRoot.ChildRenderFunction<Payload>;
}

export interface PopoverRootActions {
  unmount: () => void;
  close: () => void;
}

export type PopoverRootChildRenderFunction<Payload> = (arg: {
  payload: Payload | undefined;
}) => React.ReactNode;

export type PopoverRootChangeEventReason =
  | 'trigger-hover'
  | 'trigger-focus'
  | 'trigger-press'
  | 'outside-press'
  | 'escape-key'
  | 'close-press'
  | 'focus-out'
  | 'imperative-action'
  | 'none';
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
  export type ChildRenderFunction<Payload> = PopoverRootChildRenderFunction<Payload>;
}
