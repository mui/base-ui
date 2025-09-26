'use client';
import * as React from 'react';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import type { EventEmitter } from '@base-ui-components/utils/EventEmitter';
import type { DialogEventMap } from '../store';
import {
  useClick,
  useDismiss,
  useFloatingParentNodeId,
  useFloatingRootContext,
  useInteractions,
  useRole,
} from '../../floating-ui-react';
import { getTarget } from '../../floating-ui-react/utils';
import { useScrollLock } from '../../utils/useScrollLock';
import { useTransitionStatus } from '../../utils/useTransitionStatus';
import type { FloatingUIOpenChangeDetails } from '../../utils/types';
import { useOpenInteractionType } from '../../utils/useOpenInteractionType';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { type DialogRoot } from './DialogRoot';
import { DialogStore } from '../store';

export function useDialogRoot(params: useDialogRoot.Parameters): useDialogRoot.ReturnValue {
  const { store, parentEvents, onOpenChange: onOpenChangeParameter } = params;

  const open = store.useState('open');
  const dismissible = store.useState('dismissible');
  const modal = store.useState('modal');
  const triggerElement = store.useState('triggerElement');
  const popupElement = store.useState('popupElement');

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);

  const {
    openMethod,
    triggerProps,
    reset: resetOpenInteractionType,
  } = useOpenInteractionType(open);

  const nested = useFloatingParentNodeId() != null;

  let floatingEvents: ReturnType<typeof useFloatingRootContext>['events'];

  const setOpen = useEventCallback(
    (nextOpen: boolean, eventDetails: DialogRoot.ChangeEventDetails) => {
      onOpenChangeParameter?.(nextOpen, eventDetails);

      if (eventDetails.isCanceled) {
        return;
      }

      const details: FloatingUIOpenChangeDetails = {
        open: nextOpen,
        nativeEvent: eventDetails.event,
        reason: eventDetails.reason,
        nested,
      };

      floatingEvents.emit('openchange', details);

      store.set('open', nextOpen);
    },
  );

  const handleUnmount = useEventCallback(() => {
    setMounted(false);
    store.events.emit('openChangeComplete', false);
    resetOpenInteractionType();
  });

  useOpenChangeComplete({
    enabled: !params.actionsRef,
    open,
    ref: store.elements.popupRef,
    onComplete() {
      if (!open) {
        handleUnmount();
      }
    },
  });

  React.useImperativeHandle(params.actionsRef, () => ({ unmount: handleUnmount }), [handleUnmount]);

  const context = useFloatingRootContext({
    elements: { reference: triggerElement, floating: popupElement },
    open,
    onOpenChange: setOpen,
    noEmit: true,
  });

  floatingEvents = context.events;

  store.events.useHandler('setOpen', setOpen);

  const [ownNestedOpenDialogs, setOwnNestedOpenDialogs] = React.useState(0);
  const isTopmost = ownNestedOpenDialogs === 0;

  const role = useRole(context);
  const click = useClick(context);
  const dismiss = useDismiss(context, {
    outsidePressEvent() {
      if (store.elements.internalBackdropRef.current || store.elements.backdropRef.current) {
        return 'intentional';
      }
      // Ensure `aria-hidden` on outside elements is removed immediately
      // on outside press when trapping focus.
      return {
        mouse: modal === 'trap-focus' ? 'sloppy' : 'intentional',
        touch: 'sloppy',
      };
    },
    outsidePress(event) {
      if (event.button !== 0) {
        return false;
      }
      const target = getTarget(event) as Element | null;
      if (isTopmost && dismissible) {
        const eventTarget = target as Element | null;
        // Only close if the click occurred on the dialog's owning backdrop.
        // This supports multiple modal dialogs that aren't nested in the React tree:
        // https://github.com/mui/base-ui/issues/1320
        if (modal) {
          return store.elements.internalBackdropRef.current || store.elements.backdropRef.current
            ? store.elements.internalBackdropRef.current === eventTarget ||
                store.elements.backdropRef.current === eventTarget
            : true;
        }
        return true;
      }
      return false;
    },
    escapeKey: isTopmost,
  });

  useScrollLock({
    enabled: open && modal === true,
    mounted,
    open,
    referenceElement: popupElement,
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([role, click, dismiss]);

  // Listen for nested open/close events on this store to maintain the count
  store.events.useHandler('nestedDialogOpen', (ownChildrenCount) => {
    setOwnNestedOpenDialogs(ownChildrenCount + 1);
  });

  store.events.useHandler('nestedDialogClose', () => {
    setOwnNestedOpenDialogs(0);
  });

  // Notify parent of our open/close state using its event emitter, if any
  React.useEffect(() => {
    if (parentEvents && open) {
      parentEvents.emit('nestedDialogOpen', ownNestedOpenDialogs);
    }
    if (parentEvents && !open) {
      parentEvents.emit('nestedDialogClose');
    }
    return () => {
      if (parentEvents && open) {
        parentEvents.emit('nestedDialogClose');
      }
    };
  }, [open, parentEvents, ownNestedOpenDialogs]);

  // Handlers now wired via events; explicit callbacks removed

  const dialogTriggerProps = React.useMemo(
    () => getReferenceProps(triggerProps),
    [getReferenceProps, triggerProps],
  );

  store.useSyncedValues({
    openMethod,
    mounted,
    transitionStatus,
    triggerProps: dialogTriggerProps,
    popupProps: getFloatingProps(),
    floatingRootContext: context,
    nestedOpenDialogCount: ownNestedOpenDialogs,
  });
}

export namespace useDialogRoot {
  export interface SharedParameters {}

  export interface Parameters {
    store: DialogStore;
    actionsRef?: DialogRoot.Props['actionsRef'];
    parentEvents?: EventEmitter<DialogEventMap>;
    onOpenChange: DialogRoot.Props['onOpenChange'];
  }

  export type ReturnValue = void;
}
