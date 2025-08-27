'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useTimeout } from '@base-ui-components/utils/useTimeout';
import { useControlled } from '@base-ui-components/utils/useControlled';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { useStore } from '@base-ui-components/utils/store';
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
import {
  createBaseUIEventDetails,
  type BaseUIEventDetails,
} from '../../utils/createBaseUIEventDetails';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { PATIENT_CLICK_THRESHOLD } from '../../utils/constants';
import { useScrollLock } from '../../utils/useScrollLock';
import { PopoverRootContext, usePopoverRootContext } from './PopoverRootContext';
import { PopoverStore, selectors } from '../store';
import type { FloatingUIOpenChangeDetails, BaseUIChangeEventReason } from '../../utils/types';

function PopoverRootComponent<Payload>({ props }: { props: PopoverRoot.Props<Payload> }) {
  const {
    open: openProp,
    defaultOpen: defaultOpenProp = false,
    onOpenChange,
    onOpenChangeComplete,
    modal = false,
    handle,
    triggerId: triggerIdProp,
  } = props;

  const backdropRef = React.useRef<HTMLDivElement | null>(null);
  const internalBackdropRef = React.useRef<HTMLDivElement | null>(null);

  const nested = useFloatingParentNodeId() != null;

  let floatingEvents: ReturnType<typeof useFloatingRootContext>['events'];

  const [openState, setOpenState] = useControlled({
    controlled: openProp,
    default: defaultOpenProp,
    name: 'Popover',
    state: 'open',
  });

  const [triggerId, setTriggerId] = useControlled<string | null | undefined>({
    controlled: triggerIdProp,
    default: undefined,
    name: 'Popover',
    state: 'triggerId',
  });

  const store = useRefWithInit(() => {
    return (
      handle ||
      new PopoverStore<Payload>({
        open: openState,
        modal,
        activeTriggerId: triggerId,
      })
    );
  }).current;

  const triggerElements = useStore(store, selectors.triggers);

  let resolvedTriggerId: string | null = null;
  if (openState === true && triggerIdProp === undefined && triggerElements.size === 1) {
    resolvedTriggerId = triggerElements.keys().next().value || null;
  } else {
    resolvedTriggerId = triggerId ?? null;
  }

  const open = useStore(store, selectors.open);
  const positionerElement = useStore(store, selectors.positionerElement);
  const activeTriggerElement = useStore(store, selectors.activeTriggerElement);
  const payload = useStore(store, selectors.payload) as Payload | undefined;
  const openReason = useStore(store, selectors.openReason);
  const openMethod = useStore(store, selectors.openMethod);

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);
  const popupRef = React.useRef<HTMLElement>(null);
  const stickIfOpenTimeout = useTimeout();

  useIsoLayoutEffect(() => {
    store.set('open', openState);
    store.set('mounted', mounted);
    if (!mounted) {
      store.set('activeTriggerId', null);
    }
  }, [store, openState, mounted]);

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

  useIsoLayoutEffect(() => {
    store.set('transitionStatus', transitionStatus);
  }, [store, transitionStatus]);

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

  const setOpen = useEventCallback(function setOpen(
    nextOpen: boolean,
    eventDetails: PopoverRoot.ChangeEventDetails,
    trigger: HTMLElement | undefined,
  ) {
    const isHover = eventDetails.reason === 'trigger-hover';
    const isKeyboardClick =
      eventDetails.reason === 'trigger-press' && (eventDetails.event as MouseEvent).detail === 0;
    const isDismissClose =
      !nextOpen && (eventDetails.reason === 'escape-key' || eventDetails.reason == null);

    const options = new PopoverRoot.OpenChangeOptions();
    onOpenChange?.(nextOpen, eventDetails, nextOpen ? (trigger?.id ?? null) : null, options);

    if (eventDetails.isCanceled) {
      return;
    }

    const details: FloatingUIOpenChangeDetails = {
      open: nextOpen,
      nativeEvent: eventDetails.event,
      reason: eventDetails.reason as BaseUIChangeEventReason,
      nested,
      triggerElement: trigger,
    };

    floatingEvents?.emit('openchange', details);

    function changeState() {
      const newTriggerId = trigger?.id ?? null;
      preventUnmountingRef.current = options.isUnmountingPrevented;
      setOpenState(nextOpen);
      setTriggerId(newTriggerId);

      if (nextOpen) {
        store.set('openReason', eventDetails.reason ?? null);
      }

      store.set('open', nextOpen);
      store.set('activeTriggerId', trigger?.id ?? null);
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
    } else {
      store.set('instantType', undefined);
    }
  });

  const handleUnmount = useEventCallback(() => {
    setMounted(false);
    store.apply({ stickIfOpen: true, openReason: null, activeTriggerId: null, mounted: false });
    onOpenChangeComplete?.(false);
  });

  const handleImperativeClose = React.useCallback(() => {
    setOpen(false, createBaseUIEventDetails('imperative-action'), undefined);
  }, [setOpen]);

  useOpenChangeComplete({
    enabled: !preventUnmountingRef.current,
    open,
    ref: popupRef,
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

  useIsoLayoutEffect(() => {
    store.apply({
      modal,
      activeTriggerProps: getReferenceProps(),
      inactiveTriggerProps: getTriggerProps(),
      popupProps: getFloatingProps(),
      floatingRootContext: floatingContext,
    });
  }, [modal, getReferenceProps, getTriggerProps, getFloatingProps, floatingContext, store]);

  const popoverContext: PopoverRootContext = React.useMemo(
    () => ({
      setOpen,
      popupRef,
      backdropRef,
      internalBackdropRef,
      onOpenChangeComplete,
      store,
    }),
    [setOpen, popupRef, onOpenChangeComplete, store],
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

export namespace PopoverRoot {
  export interface State {}

  export interface Props<Payload = unknown> {
    /**
     * Whether the popover is currently open.
     */
    open?: boolean;
    /**
     * Whether the popover is initially open.
       To render a controlled popover, use the `open` prop instead.
     */
    defaultOpen?: boolean;
    /**
     * Event handler called when the popover is opened or closed.
     */
    onOpenChange?: (
      open: boolean,
      eventDetails: ChangeEventDetails,
      activeTriggerId: string | null,
      options: OpenChangeOptions,
    ) => void;
    /**
     * Event handler called after any animations complete when the popover is opened or closed.
     */
    onOpenChangeComplete?: (open: boolean) => void;
    /**
     * Id of the trigger that the popover is associated with.
     * This is useful in conjuntion with the `open` prop to create a controlled popover.
     * There's no need to specify this prop when the popover is uncontrolled (i.e. when the `open` prop is not set).
     */
    triggerId?: string | null;
    /**
     * A ref to imperative actions.
     * - `unmount`: When specified, the popover will not be unmounted when closed.
     * Instead, the `unmount` function must be called to unmount the popover manually.
     * Useful when the popover's animation is controlled by an external library.
     */
    actionsRef?: React.RefObject<Actions | null>;
    /**
     * Determines if the popover enters a modal state when open.
     * - `true`: user interaction is limited to the popover: document page scroll is locked, and pointer interactions on outside elements are disabled.
     * - `false`: user interaction with the rest of the document is allowed.
     * - `'trap-focus'`: focus is trapped inside the popover, but document page scroll is not locked and pointer interactions outside of it remain enabled.
     * @default false
     */
    modal?: boolean | 'trap-focus';
    /**
     * A handle to associate the popover with a trigger.
     * If specified, allows external triggers to control the popover's open state.
     */
    handle?: PopoverStore<Payload>;
    /**
     * The content of the popover.
     * This can be a regular React node or a render function that receives the `payload` of the active trigger.
     */
    children?: React.ReactNode | ChildRenderFunction<Payload>;
  }

  export interface Actions {
    unmount: () => void;
    close: () => void;
  }

  export class OpenChangeOptions {
    #isUnmountingPrevented: boolean = false;

    get isUnmountingPrevented() {
      return this.#isUnmountingPrevented;
    }

    preventUnmountOnClose() {
      this.#isUnmountingPrevented = true;
    }
  }

  export type ChildRenderFunction<Payload> = (arg: {
    payload: Payload | undefined;
  }) => React.ReactNode;

  export type ChangeEventReason = BaseUIChangeEventReason | 'close-press' | 'imperative-action';
  export type ChangeEventDetails = BaseUIEventDetails<ChangeEventReason>;
}
