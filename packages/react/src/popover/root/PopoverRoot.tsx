'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useTimeout } from '@base-ui-components/utils/useTimeout';
import { useControlled } from '@base-ui-components/utils/useControlled';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { Store, useSelector } from '@base-ui-components/utils/store';
import { useLazyRef } from '@base-ui-components/utils/useLazyRef';
import { useModernLayoutEffect } from '@base-ui-components/utils/useModernLayoutEffect';
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
import { usePopupAutoResize } from '../../utils/usePopupAutoResize';
import { State, selectors } from '../store';
import { getEmptyContext } from '../../floating-ui-react/hooks/useFloatingRootContext';
import { PopoverHandle } from '../handle/createPopover';

function PopoverRootComponent({ props }: { props: PopoverRoot.Props }) {
  const {
    open: externalOpen,
    onOpenChange,
    defaultOpen = false,
    onOpenChangeComplete,
    modal = false,
    handle,
  } = props;

  const store = useLazyRef((localHandle) => {
    return (
      localHandle?.store ||
      new Store<State>({
        open: false,
        modal: false,
        mounted: false,
        activeTriggerElement: null,
        positionerElement: null,
        popupElement: null,
        triggers: new Map<HTMLElement, (() => unknown) | undefined>(),
        instantType: undefined,
        transitionStatus: 'idle',
        openMethod: null,
        openReason: null,
        titleId: undefined,
        descriptionId: undefined,
        floatingRootContext: getEmptyContext(),
        triggerProps: {},
        popupProps: {},
        payload: undefined,
        stickIfOpen: true,
      })
    );
  }, handle).current;

  const positionerElement = useSelector(store, selectors.positionerElement);
  const popupElement = useSelector(store, selectors.popupElement);
  const activeTriggerElement = useSelector(store, selectors.activeTriggerElement);
  const payload = useSelector(store, selectors.payload);
  const openReason = useSelector(store, selectors.openReason);

  const popupRef = React.useRef<HTMLElement>(null);
  const stickIfOpenTimeout = useTimeout();

  const [open, setOpenUnwrapped] = useControlled({
    controlled: externalOpen,
    default: defaultOpen,
    name: 'Popover',
    state: 'open',
  });

  usePopupAutoResize(popupElement, open, payload);

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);
  React.useLayoutEffect(() => {
    store.apply({ open, mounted });
  }, [store, open, mounted]);

  useModernLayoutEffect(() => {
    store.set('transitionStatus', transitionStatus);
  }, [store, transitionStatus]);

  useScrollLock({
    enabled: open && modal === true && openReason !== 'trigger-hover',
    mounted,
    open,
    referenceElement: positionerElement,
  });

  const handleUnmount = useEventCallback(() => {
    setMounted(false);
    store.apply({ stickIfOpen: true, openReason: null });
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

  const triggerElements = useSelector(store, selectors.triggers);

  const setOpen = useEventCallback(function setOpen(
    nextOpen: boolean,
    event: Event | undefined,
    reason: PopoverOpenChangeReason | undefined,
    trigger: Element | undefined,
  ) {
    console.log('setOpen', nextOpen, event, reason, trigger);

    if (event && nextOpen && trigger) {
      store.set('activeTriggerElement', trigger);
    }

    if (nextOpen && trigger) {
      const triggerPayload = triggerElements.get(trigger as HTMLElement);
      if (triggerPayload !== undefined) {
        store.set('payload', triggerPayload());
      }
    }

    const isHover = reason === 'trigger-hover';
    const isKeyboardClick = reason === 'trigger-press' && (event as MouseEvent).detail === 0;
    const isDismissClose = !nextOpen && (reason === 'escape-key' || reason == null);

    function changeState() {
      onOpenChange?.(nextOpen, event, reason);
      setOpenUnwrapped(nextOpen);

      if (nextOpen) {
        store.set('openReason', reason ?? null);
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
      setOpen(openValue, eventValue, translateOpenChangeReason(reasonValue), trigger);
    },
  });

  const dismiss = useDismiss(floatingContext);
  const role = useRole(floatingContext);

  const { getReferenceProps, getFloatingProps } = useInteractions([dismiss, role]);

  useModernLayoutEffect(() => {
    store.apply({
      triggerProps: getReferenceProps(),
      popupProps: getFloatingProps(),
      floatingRootContext: floatingContext,
    });
  }, [getReferenceProps, getFloatingProps, floatingContext, store]);

  React.useEffect(() => {
    if (handle !== undefined) {
      handle.registerPopup(floatingContext);
    }
  }, [handle, floatingContext]);

  const popoverContext: PopoverRootContext = React.useMemo(
    () => ({
      setOpen,
      popupRef,
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
export function PopoverRoot(props: PopoverRoot.Props) {
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

  export interface Props {
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
    onOpenChange?: (
      open: boolean,
      event: Event | undefined,
      reason: OpenChangeReason | undefined,
    ) => void;
    /**
     * Event handler called after any animations complete when the popover is opened or closed.
     */
    onOpenChangeComplete?: (open: boolean) => void;
    /**
     * Whether the popover should also open when the trigger is hovered.
     * @default false
     */
    openOnHover?: boolean;
    /**
     * How long to wait before the popover may be opened on hover. Specified in milliseconds.
     *
     * Requires the `openOnHover` prop.
     * @default 300
     */
    delay?: number;
    /**
     * How long to wait before closing the popover that was opened on hover.
     * Specified in milliseconds.
     *
     * Requires the `openOnHover` prop.
     * @default 0
     */
    closeDelay?: number;
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
    children?: React.ReactNode | (({ payload }: { payload: any }) => React.ReactNode);
    handle?: PopoverHandle<any>;
  }

  export interface Actions {
    unmount: () => void;
  }

  export type OpenChangeReason = PopoverOpenChangeReason;
}
