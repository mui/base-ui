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
} from '../../floating-ui-react';
import { useTransitionStatus } from '../../utils/useTransitionStatus';
import { translateOpenChangeReason } from '../../utils/translateOpenChangeReason';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { PATIENT_CLICK_THRESHOLD } from '../../utils/constants';
import { useScrollLock } from '../../utils/useScrollLock';
import {
  PopoverOpenChangeReason,
  PopoverRootContext,
  usePopoverRootContext,
} from './PopoverRootContext';
import { PopoverStore, selectors } from '../store';

function PopoverRootComponent<Payload>({ props }: { props: PopoverRoot.Props<Payload> }) {
  const {
    open: openProp,
    defaultOpen: defaultOpenProp = null,
    onOpenChange,
    onOpenChangeComplete,
    modal = false,
    handle,
  } = props;

  const backdropRef = React.useRef<HTMLDivElement | null>(null);
  const internalBackdropRef = React.useRef<HTMLDivElement | null>(null);

  const [activeTriggerState, setActiveTriggerState] = useControlled({
    controlled: openProp,
    default: defaultOpenProp,
    name: 'Popover',
    state: 'open',
  });

  const store = useRefWithInit(() => {
    return (
      handle ||
      new PopoverStore<Payload>({
        open: activeTriggerState !== null && activeTriggerState !== false,
        modal,
      })
    );
  }).current;

  const triggerElements = useStore(store, selectors.triggers);

  let resolvedTriggerElement: HTMLElement | null = null;
  if (activeTriggerState === true) {
    if (triggerElements.size > 1) {
      throw new Error(
        'Base UI: PopoverRoot: When `open` is set to `true` there must be exactly one Trigger element inside the Root.',
      );
    } else if (triggerElements.size === 1) {
      resolvedTriggerElement = triggerElements.keys().next().value || null;
    }
  } else if (activeTriggerState === false) {
    resolvedTriggerElement = null;
  } else {
    resolvedTriggerElement = activeTriggerState as HTMLElement | null;
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
    store.set('open', activeTriggerState !== null && activeTriggerState !== false);

    if (!mounted) {
      store.set('activeTriggerElement', null);
    }
  }, [store, activeTriggerState, mounted]);

  useIsoLayoutEffect(() => {
    if (resolvedTriggerElement != null) {
      store.set('activeTriggerElement', resolvedTriggerElement);
      const triggerPayload = triggerElements.get(resolvedTriggerElement);
      store.set('payload', triggerPayload?.() ?? undefined);
    } else {
      store.set('payload', undefined);
    }
  }, [store, resolvedTriggerElement, triggerElements]);

  useIsoLayoutEffect(() => {
    store.set('transitionStatus', transitionStatus);
  }, [store, transitionStatus]);

  useScrollLock({
    enabled: open && modal === true && openReason !== 'trigger-hover' && openMethod !== 'touch',
    mounted,
    open,
    referenceElement: positionerElement,
  });

  const handleUnmount = useEventCallback(() => {
    setMounted(false);
    store.apply({ stickIfOpen: true, openReason: null, activeTriggerElement: null });
    onOpenChangeComplete?.(false);
  });

  useOpenChangeComplete({
    enabled: !props.actionsRef,
    open,
    ref: popupRef,
    onComplete() {
      if (!open) {
        handleUnmount();
      }
    },
  });

  React.useImperativeHandle(props.actionsRef, () => ({ unmount: handleUnmount }), [handleUnmount]);

  React.useEffect(() => {
    if (!open) {
      stickIfOpenTimeout.clear();
    }
  }, [stickIfOpenTimeout, open]);

  const setOpen = useEventCallback(function setOpen(
    nextOpen: boolean,
    event: Event | undefined,
    reason: PopoverOpenChangeReason | undefined,
    trigger: HTMLElement | undefined,
  ) {
    const isHover = reason === 'trigger-hover';
    const isKeyboardClick = reason === 'trigger-press' && (event as MouseEvent).detail === 0;
    const isDismissClose = !nextOpen && (reason === 'escape-key' || reason == null);

    function changeState() {
      onOpenChange?.(nextOpen, event, reason, nextOpen ? (trigger ?? null) : null);

      if (nextOpen && trigger) {
        setActiveTriggerState(trigger as HTMLElement);
      } else if (nextOpen === false) {
        setActiveTriggerState(null);
      }

      if (nextOpen) {
        store.set('openReason', reason ?? null);
      }

      store.set('open', nextOpen);
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

  const floatingContext = useFloatingRootContext({
    elements: {
      reference: activeTriggerElement,
      floating: positionerElement,
      triggers: Array.from(triggerElements.keys()),
    },
    open,
    onOpenChange(openValue, eventValue, reasonValue, trigger) {
      setOpen(
        openValue,
        eventValue,
        translateOpenChangeReason(reasonValue),
        trigger as HTMLElement,
      );
    },
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
    // TODO: Not sure if HTMLElement is the best type here.
    // This requires getting the actual trigger element, which may be cumbersome.
    // Considering a string id instead.
    open?: HTMLElement | null | boolean;
    defaultOpen?: HTMLElement | null | boolean;
    /**
     * Event handler called when the popover is opened or closed.
     */
    onOpenChange?: (
      nextOpen: boolean,
      event: Event | undefined,
      reason: OpenChangeReason | undefined,
      nextActiveTrigger: HTMLElement | null,
    ) => void;
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
    actionsRef?: React.RefObject<Actions>;
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
    children?: React.ReactNode | ChildRenderFunction<Payload>;
  }

  export interface Actions {
    unmount: () => void;
  }

  export type ChildRenderFunction<Payload> = ({
    payload,
  }: {
    payload: Payload | undefined;
  }) => React.ReactNode;

  export type OpenChangeReason = PopoverOpenChangeReason;
}
