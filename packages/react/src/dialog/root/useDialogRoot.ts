'use client';
import * as React from 'react';
import { useScrollLock } from '@base-ui/utils/useScrollLock';
import {
  useDismiss,
  useInteractions,
  useRole,
  useSyncedFloatingRootContext,
} from '../../floating-ui-react';
import { contains, getTarget } from '../../floating-ui-react/utils';
import { useOpenInteractionType } from '../../utils/useOpenInteractionType';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { type DialogRoot } from './DialogRoot';
import { DialogStore } from '../store/DialogStore';
import { useImplicitActiveTrigger, useOpenStateTransitions } from '../../utils/popups';

export function useDialogRoot(params: UseDialogRootParameters): UseDialogRootReturnValue {
  const { store, parentContext, actionsRef, isDrawer } = params;

  const open = store.useState('open');
  const disablePointerDismissal = store.useState('disablePointerDismissal');
  const modal = store.useState('modal');
  const popupElement = store.useState('popupElement');

  const { openMethod, triggerProps } = useOpenInteractionType(open);

  useImplicitActiveTrigger(store);
  const { forceUnmount } = useOpenStateTransitions(open, store);

  const handleImperativeClose = React.useCallback(() => {
    store.setOpen(false, createChangeEventDetails(REASONS.imperativeAction));
  }, [store]);

  React.useImperativeHandle(
    actionsRef,
    () => ({ unmount: forceUnmount, close: handleImperativeClose }),
    [forceUnmount, handleImperativeClose],
  );

  const floatingRootContext = useSyncedFloatingRootContext({
    popupStore: store,
    onOpenChange: store.setOpen,
    treatPopupAsFloatingElement: true,
  });

  const [ownNestedOpenDialogs, setOwnNestedOpenDialogs] = React.useState(0);
  const [ownNestedOpenDrawers, setOwnNestedOpenDrawers] = React.useState(0);
  const isTopmost = ownNestedOpenDialogs === 0;

  const role = useRole(floatingRootContext);
  const dismiss = useDismiss(floatingRootContext, {
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
      if (!store.context.outsidePressEnabledRef.current) {
        return false;
      }

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

  // Listen for nested open/close events on this store to maintain the counts.
  store.useContextCallback('onNestedDialogOpen', (dialogCount, drawerCount) => {
    setOwnNestedOpenDialogs(dialogCount);
    setOwnNestedOpenDrawers(drawerCount);
  });

  store.useContextCallback('onNestedDialogClose', () => {
    setOwnNestedOpenDialogs(0);
    setOwnNestedOpenDrawers(0);
  });

  // Notify parent of our open/close state using parent callbacks, if any
  React.useEffect(() => {
    if (parentContext?.onNestedDialogOpen && open) {
      parentContext.onNestedDialogOpen(
        ownNestedOpenDialogs + 1,
        ownNestedOpenDrawers + (isDrawer ? 1 : 0),
      );
    }
    if (parentContext?.onNestedDialogClose && !open) {
      parentContext.onNestedDialogClose();
    }
    return () => {
      if (parentContext?.onNestedDialogClose && open) {
        parentContext.onNestedDialogClose();
      }
    };
  }, [isDrawer, open, ownNestedOpenDialogs, ownNestedOpenDrawers, parentContext]);

  const activeTriggerProps = React.useMemo(
    () => getReferenceProps(triggerProps),
    [getReferenceProps, triggerProps],
  );

  const inactiveTriggerProps = React.useMemo(
    () => getTriggerProps(triggerProps),
    [getTriggerProps, triggerProps],
  );

  const popupProps = React.useMemo(() => getFloatingProps(), [getFloatingProps]);

  store.useSyncedValues({
    openMethod,
    activeTriggerProps,
    inactiveTriggerProps,
    popupProps,
    floatingRootContext,
    nestedOpenDialogCount: ownNestedOpenDialogs,
    nestedOpenDrawerCount: ownNestedOpenDrawers,
  });
}

export interface UseDialogRootSharedParameters {}

export interface UseDialogRootParameters {
  store: DialogStore<any>;
  actionsRef?: DialogRoot.Props['actionsRef'] | undefined;
  parentContext?: DialogStore<unknown>['context'] | undefined;
  onOpenChange: DialogRoot.Props['onOpenChange'];
  isDrawer: boolean;
  triggerIdProp?: string | null | undefined;
}

export type UseDialogRootReturnValue = void;

export interface UseDialogRootState {}
