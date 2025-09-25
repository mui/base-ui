'use client';
import * as React from 'react';
import { useStore } from '@base-ui-components/utils/store';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
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
import { DialogStore, selectors } from '../store';

export function useDialogRoot(params: useDialogRoot.Parameters): useDialogRoot.ReturnValue {
  const {
    store,
    onNestedDialogClose,
    onNestedDialogOpen,
    onOpenChange: onOpenChangeParameter,
    onOpenChangeComplete,
  } = params;

  const open = useStore(store, selectors.open);
  const dismissible = useStore(store, selectors.dismissible);
  const modal = useStore(store, selectors.modal);
  const triggerElement = useStore(store, selectors.triggerElement);
  const popupElement = useStore(store, selectors.popupElement);

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
    onOpenChangeComplete?.(false);
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

  React.useLayoutEffect(() => {
    interface SetOpenParameters {
      open: boolean;
      eventDetails: DialogRoot.ChangeEventDetails;
    }

    function handleSetOpen(parameters: SetOpenParameters) {
      setOpen(parameters.open, parameters.eventDetails);
    }

    floatingEvents.on('setOpen', handleSetOpen);
    return () => {
      floatingEvents.off('setOpen', handleSetOpen);
    };
  }, [floatingEvents, setOpen]);

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

  React.useEffect(() => {
    if (onNestedDialogOpen && open) {
      onNestedDialogOpen(ownNestedOpenDialogs);
    }

    if (onNestedDialogClose && !open) {
      onNestedDialogClose();
    }

    return () => {
      if (onNestedDialogClose && open) {
        onNestedDialogClose();
      }
    };
  }, [open, onNestedDialogClose, onNestedDialogOpen, ownNestedOpenDialogs]);

  const handleNestedDialogOpen = React.useCallback((ownChildrenCount: number) => {
    setOwnNestedOpenDialogs(ownChildrenCount + 1);
  }, []);

  const handleNestedDialogClose = React.useCallback(() => {
    setOwnNestedOpenDialogs(0);
  }, []);

  const dialogTriggerProps = React.useMemo(
    () => getReferenceProps(triggerProps),
    [getReferenceProps, triggerProps],
  );

  store.useProps({
    openMethod,
    mounted,
    transitionStatus,
    triggerProps: dialogTriggerProps,
    popupProps: getFloatingProps(),
    floatingRootContext: context,
    nestedOpenDialogCount: ownNestedOpenDialogs,
  });

  return React.useMemo(() => {
    return {
      onNestedDialogOpen: handleNestedDialogOpen,
      onNestedDialogClose: handleNestedDialogClose,
    } satisfies useDialogRoot.ReturnValue;
  }, [handleNestedDialogOpen, handleNestedDialogClose]);
}

export namespace useDialogRoot {
  export interface SharedParameters {}

  export interface Parameters {
    store: DialogStore;
    actionsRef?: DialogRoot.Props['actionsRef'];
    onNestedDialogOpen?: (ownChildrenCount: number) => void;
    onNestedDialogClose?: () => void;
    onOpenChange: DialogRoot.Props['onOpenChange'];
    onOpenChangeComplete: DialogRoot.Props['onOpenChangeComplete'];
  }

  export interface ReturnValue {
    /**
     * Callback to invoke when a nested dialog is closed.
     */
    onNestedDialogClose?: () => void;
    /**
     * Callback to invoke when a nested dialog is opened.
     */
    onNestedDialogOpen?: (ownChildrenCount: number) => void;
  }
}
