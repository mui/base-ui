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
} from '../../floating-ui-react';
import { contains, getTarget } from '../../floating-ui-react/utils';
import { useTransitionStatus } from '../../utils/useTransitionStatus';
import { useOpenInteractionType } from '../../utils/useOpenInteractionType';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';
import { type DialogRoot } from './DialogRoot';
import { DialogStore } from '../store/DialogStore';

export function useDialogRoot(params: useDialogRoot.Parameters): useDialogRoot.ReturnValue {
  const { store, parentContext, actionsRef, triggerIdProp } = params;

  const open = store.useState('open');
  const disablePointerDismissal = store.useState('disablePointerDismissal');
  const modal = store.useState('modal');
  const triggerElement = store.useState('activeTriggerElement');
  const popupElement = store.useState('popupElement');
  const triggerElements = store.useState('triggers');
  const activeTriggerId = store.useState('activeTriggerId');

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);

  let resolvedTriggerId: string | null = null;
  if (mounted === true && triggerIdProp === undefined && triggerElements.size === 1) {
    resolvedTriggerId = triggerElements.keys().next().value || null;
  } else {
    resolvedTriggerId = activeTriggerId ?? null;
  }

  useIsoLayoutEffect(() => {
    store.set('mounted', mounted);
    if (!mounted) {
      store.set('activeTriggerId', null);
      store.set('payload', undefined);
    }
  }, [store, mounted]);

  useIsoLayoutEffect(() => {
    if (open) {
      store.set('activeTriggerId', resolvedTriggerId);
    }
  }, [store, resolvedTriggerId, open]);

  const {
    openMethod,
    triggerProps,
    reset: resetOpenInteractionType,
  } = useOpenInteractionType(open);

  const handleUnmount = useStableCallback(() => {
    setMounted(false);
    store.update({ open: false, mounted: false, activeTriggerId: null });
    store.context.onOpenChangeComplete?.(false);
    resetOpenInteractionType();
  });

  const createDialogEventDetails = useStableCallback((reason: DialogRoot.ChangeEventReason) => {
    const details: DialogRoot.ChangeEventDetails =
      createChangeEventDetails<DialogRoot.ChangeEventReason>(
        reason,
      ) as DialogRoot.ChangeEventDetails;
    details.preventUnmountOnClose = () => {
      store.context.preventUnmountingOnCloseRef.current = true;
    };

    return details;
  });

  const handleImperativeClose = React.useCallback(() => {
    store.setOpen(false, createDialogEventDetails(REASONS.imperativeAction));
  }, [store, createDialogEventDetails]);

  useOpenChangeComplete({
    enabled: !store.context.preventUnmountingOnCloseRef.current,
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

  const context = useFloatingRootContext({
    elements: {
      reference: triggerElement,
      floating: popupElement,
      triggers: Array.from(triggerElements.values()),
    },
    open,
    onOpenChange: store.setOpen,
    noEmit: true,
  });

  const [ownNestedOpenDialogs, setOwnNestedOpenDialogs] = React.useState(0);
  const isTopmost = ownNestedOpenDialogs === 0;

  const role = useRole(context);
  const dismiss = useDismiss(context, {
    outsidePressEvent() {
      if (store.context.internalBackdropRef.current || store.context.backdropRef.current) {
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
      // For mouse events, only accept left button (button 0)
      // For touch events, a single touch is equivalent to left button
      if ('button' in event && event.button !== 0) {
        return false;
      }
      if ('touches' in event && event.touches.length !== 1) {
        return false;
      }
      const target = getTarget(event) as Element | null;
      if (isTopmost && !disablePointerDismissal) {
        const eventTarget = target as Element | null;
        // Only close if the click occurred on the dialog's owning backdrop.
        // This supports multiple modal dialogs that aren't nested in the React tree:
        // https://github.com/mui/base-ui/issues/1320
        if (modal) {
          return store.context.internalBackdropRef.current || store.context.backdropRef.current
            ? store.context.internalBackdropRef.current === eventTarget ||
                store.context.backdropRef.current === eventTarget ||
                (contains(eventTarget, popupElement) &&
                  !eventTarget?.hasAttribute('data-base-ui-portal'))
            : true;
        }
        return true;
      }
      return false;
    },
    escapeKey: isTopmost,
  });

  useScrollLock(open && modal === true, popupElement);

  const { getReferenceProps, getFloatingProps, getTriggerProps } = useInteractions([role, dismiss]);

  // Listen for nested open/close events on this store to maintain the count
  store.useContextCallback('onNestedDialogOpen', (ownChildrenCount) => {
    setOwnNestedOpenDialogs(ownChildrenCount + 1);
  });

  store.useContextCallback('onNestedDialogClose', () => {
    setOwnNestedOpenDialogs(0);
  });

  // Notify parent of our open/close state using parent callbacks, if any
  React.useEffect(() => {
    if (parentContext?.onNestedDialogOpen && open) {
      parentContext.onNestedDialogOpen(ownNestedOpenDialogs);
    }
    if (parentContext?.onNestedDialogClose && !open) {
      parentContext.onNestedDialogClose();
    }
    return () => {
      if (parentContext?.onNestedDialogClose && open) {
        parentContext.onNestedDialogClose();
      }
    };
  }, [open, parentContext, ownNestedOpenDialogs]);

  const dialogTriggerProps = React.useMemo(
    () => getReferenceProps(triggerProps),
    [getReferenceProps, triggerProps],
  );

  store.useSyncedValues({
    openMethod,
    transitionStatus,
    activeTriggerProps: dialogTriggerProps,
    inactiveTriggerProps: getTriggerProps(triggerProps),
    popupProps: getFloatingProps(),
    floatingRootContext: context,
    nestedOpenDialogCount: ownNestedOpenDialogs,
  });
}

export interface UseDialogRootSharedParameters {}

export interface UseDialogRootParameters {
  store: DialogStore<any>;
  actionsRef?: DialogRoot.Props['actionsRef'];
  parentContext?: DialogStore<unknown>['context'];
  onOpenChange: DialogRoot.Props['onOpenChange'];
  triggerIdProp?: string | null;
}

export type UseDialogRootReturnValue = void;

export namespace useDialogRoot {
  export type SharedParameters = UseDialogRootSharedParameters;
  export type Parameters = UseDialogRootParameters;
  export type ReturnValue = UseDialogRootReturnValue;
}
