'use client';
import * as React from 'react';
import { DialogInteractions } from './useDialogRoot';
import { DialogRootContext, IsDrawerContext, useDialogRootContext } from './DialogRootContext';
import { DialogStore } from '../store/DialogStore';
import type { DialogRootProps } from './DialogRoot';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import {
  useImplicitActiveTrigger,
  useOpenStateTransitions,
  usePopupRootStore,
  usePopupRootSync,
} from '../../utils/popups';

export function useRenderDialogRoot<Payload>(
  props: DialogRootProps<Payload>,
  mode: DialogRootMode = 'dialog',
) {
  const {
    children,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    onOpenChangeComplete,
    disablePointerDismissal: disablePointerDismissalProp = false,
    modal: modalProp = true,
    actionsRef,
    handle,
    triggerId: triggerIdProp,
    defaultTriggerId: defaultTriggerIdProp = null,
  } = props;

  const isDrawer = mode === 'drawer';
  const isAlertDialog = mode === 'alert-dialog';
  const modal = isAlertDialog ? true : modalProp;
  const disablePointerDismissal = isAlertDialog || disablePointerDismissalProp;
  const role: 'dialog' | 'alertdialog' = isAlertDialog ? 'alertdialog' : 'dialog';

  const parentStore = useDialogRootContext(true);
  const nested = parentStore != null;
  const rootState = { modal, disablePointerDismissal, nested, role };

  // The store is owned by this Root instance and created exactly once. It is not tied to the handle:
  // the handle attaches to it, so swapping the handle re-attaches rather than recreating state.
  // Default values are only initial values; controlled values and root state are synced after creation.
  // Dialogs pass the popup element to Floating UI as the floating element (`treatPopupAsFloatingElement`).
  const store = usePopupRootStore(
    handle,
    (floatingId, floatingNested) =>
      new DialogStore<Payload>(
        {
          open: defaultOpen,
          openProp,
          activeTriggerId: defaultTriggerIdProp,
          triggerIdProp,
          ...rootState,
        },
        floatingId,
        floatingNested,
      ),
    true,
  );

  store.useControlledProp('openProp', openProp);
  store.useControlledProp('triggerIdProp', triggerIdProp);

  store.useSyncedValues(rootState);
  store.useContextCallback('onOpenChange', onOpenChange);
  store.useContextCallback('onOpenChangeComplete', onOpenChangeComplete);

  const open = store.useState('open');
  const mounted = store.useState('mounted');
  const payload = store.useState('payload') as Payload | undefined;

  usePopupRootSync(store, open);
  useImplicitActiveTrigger(store);
  const { forceUnmount } = useOpenStateTransitions(open, store);

  React.useImperativeHandle(
    actionsRef,
    () => ({
      unmount: forceUnmount,
      close: () => store.setOpen(false, createChangeEventDetails(REASONS.imperativeAction)),
    }),
    [forceUnmount, store],
  );

  const shouldRenderInteractions = open || mounted;

  return (
    <IsDrawerContext.Provider value={false}>
      <DialogRootContext.Provider value={store as DialogStore<unknown>}>
        {shouldRenderInteractions && (
          <DialogInteractions
            store={store}
            parentContext={parentStore?.context}
            isDrawer={isDrawer}
          />
        )}
        {typeof children === 'function' ? children({ payload }) : children}
      </DialogRootContext.Provider>
    </IsDrawerContext.Provider>
  );
}

type DialogRootMode = 'dialog' | 'drawer' | 'alert-dialog';
