'use client';
import * as React from 'react';
import { useOnFirstRender } from '@base-ui/utils/useOnFirstRender';
import { DialogInteractions, useDialogRoot } from './useDialogRoot';
import { DialogRootContext, IsDrawerContext, useDialogRootContext } from './DialogRootContext';
import { DialogStore } from '../store/DialogStore';
import type { DialogRootProps } from './DialogRoot';

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

  const store = DialogStore.useStore(handle?.store, {
    open: defaultOpen,
    openProp,
    activeTriggerId: defaultTriggerIdProp,
    triggerIdProp,
    ...rootState,
  });

  useOnFirstRender(() => {
    // Support initially open state when uncontrolled.
    const shouldOpen = openProp === undefined && store.state.open === false && defaultOpen === true;
    // A reused handle store isn't seeded with `openProp` from `initialState` (the handle
    // is created before the Root knows the prop). Seed it during the first render so the
    // open selector reflects the controlled value immediately; otherwise an initially-open
    // dialog would flip from closed to open after the first paint and play an unwanted
    // enter transition (`useTransitionStatus`).
    const shouldSeedOpenProp = openProp !== undefined && store.state.openProp !== openProp;

    if (!isAlertDialog && !shouldOpen && !shouldSeedOpenProp) {
      return;
    }

    // Assign `store.state` directly instead of calling `store.update` (which notifies
    // synchronously). This runs during render, so notifying detached-trigger subscribers
    // here would update other components mid-render.
    store.state = {
      ...store.state,
      // Handles can reuse plain Dialog stores; alert dialog invariants must exist immediately.
      ...(isAlertDialog ? rootState : null),
      ...(shouldSeedOpenProp ? { openProp } : null),
      ...(shouldOpen ? { open: true, activeTriggerId: defaultTriggerIdProp } : null),
    };
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
