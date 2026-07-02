'use client';
import * as React from 'react';
import { useId } from '@base-ui/utils/useId';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { DialogInteractions, useDialogRoot } from './useDialogRoot';
import { DialogRootContext, IsDrawerContext, useDialogRootContext } from './DialogRootContext';
import { DialogStore, type State as DialogStoreState } from '../store/DialogStore';
import type { DialogRootProps } from './DialogRoot';
import type { DialogHandle } from '../store/DialogHandle';
import { useFloatingParentNodeId } from '../../floating-ui-react/components/FloatingTree';
import { useSyncedFloatingRootContext } from '../../floating-ui-react/hooks/useSyncedFloatingRootContext';

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

  const parentDialogRootContext = useDialogRootContext(true);
  const nested = Boolean(parentDialogRootContext);
  const rootState = { modal, disablePointerDismissal, nested, role };

  const store = useDialogRootStore(handle, {
    open: defaultOpen,
    openProp,
    activeTriggerId: defaultTriggerIdProp,
    triggerIdProp,
    ...rootState,
  });

  store.useControlledProp('openProp', openProp);
  store.useControlledProp('triggerIdProp', triggerIdProp);

  store.useSyncedValues(rootState);
  store.useContextCallback('onOpenChange', onOpenChange);
  store.useContextCallback('onOpenChangeComplete', onOpenChangeComplete);

  const open = store.useState('open');
  const mounted = store.useState('mounted');
  const payload = store.useState('payload') as Payload | undefined;

  useDialogRoot({ store, actionsRef });

  const shouldRenderInteractions = open || mounted;

  const contextValue: DialogRootContext<Payload> = React.useMemo(() => ({ store }), [store]);

  return (
    <IsDrawerContext.Provider value={false}>
      <DialogRootContext.Provider value={contextValue as DialogRootContext}>
        {shouldRenderInteractions && (
          <DialogInteractions
            store={store}
            parentContext={parentDialogRootContext?.store.context}
            isDrawer={isDrawer}
          />
        )}
        {typeof children === 'function' ? children({ payload }) : children}
      </DialogRootContext.Provider>
    </IsDrawerContext.Provider>
  );
}

type DialogRootMode = 'dialog' | 'drawer' | 'alert-dialog';

function useDialogRootStore<Payload>(
  handle: DialogHandle<Payload> | undefined,
  initialState: Partial<DialogStoreState<Payload>>,
) {
  const floatingId = useId();
  const floatingNested = useFloatingParentNodeId() != null;

  // The store is owned by this Root instance and created exactly once. It is not tied to the handle:
  // the handle attaches to it below, so swapping the handle re-attaches rather than recreating state.
  // Default values are only initial values; controlled values and root state are synced after creation.
  const store = useRefWithInit(
    () => new DialogStore<Payload>(initialState, floatingId, floatingNested),
  ).current;

  useSyncedFloatingRootContext({
    popupStore: store,
    treatPopupAsFloatingElement: true,
    floatingRootContext: store.state.floatingRootContext,
    floatingId,
    nested: floatingNested,
    onOpenChange: store.setOpen,
  });

  useIsoLayoutEffect(() => {
    if (!handle) {
      return undefined;
    }

    return handle.attachStore(store);
  }, [handle, store]);

  return store;
}
