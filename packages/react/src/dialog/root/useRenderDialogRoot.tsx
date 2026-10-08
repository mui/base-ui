'use client';
import * as React from 'react';
import { DialogInteractions } from './useDialogRoot';
import { DialogRootContext, useDialogRootContext } from './DialogRootContext';
import { DialogStore } from '../store/DialogStore';
import type { DialogRootProps } from './DialogRoot';
import { PopupHandleAttachment, usePopupRoot, usePopupRootSync } from '../../utils/popups';

export function useRenderDialogRoot<Payload>(
  mode: DialogRootMode,
  props: DialogRootProps<Payload>,
) {
  const {
    children,
    disablePointerDismissal: disablePointerDismissalProp = false,
    modal: modalProp = true,
    handle,
  } = props;

  const isDrawer = mode === 'drawer';
  const isAlertDialog = mode === 'alert-dialog';
  const modal = isAlertDialog ? true : modalProp;
  const disablePointerDismissal = isAlertDialog || disablePointerDismissalProp;
  const role: 'dialog' | 'alertdialog' = isAlertDialog ? 'alertdialog' : 'dialog';

  const parentStore = useDialogRootContext(true);
  const nested = parentStore != null;
  const rootState = { modal, disablePointerDismissal, nested, role };

  const { store, open, mounted, payload } = usePopupRoot(
    props,
    (initialState, floatingId, floatingNested) =>
      new DialogStore<Payload>({ ...initialState, ...rootState }, floatingId, floatingNested),
  );

  store.useSyncedValues(rootState);

  usePopupRootSync(store, open);

  // Detached triggers share this one Root, so mounting its interactions eagerly is cheap. The
  // trigger props they publish then stay stable, so opening and closing doesn't re-render inactive
  // triggers.
  const shouldRenderInteractions = open || mounted || handle != null;

  return (
    <DialogRootContext.Provider value={store as DialogStore<unknown>}>
      {handle && <PopupHandleAttachment handle={handle} store={store} />}
      {shouldRenderInteractions && (
        <DialogInteractions
          store={store}
          parentContext={parentStore?.context}
          isDrawer={isDrawer}
        />
      )}
      {typeof children === 'function'
        ? children({ payload: payload as Payload | undefined })
        : children}
    </DialogRootContext.Provider>
  );
}

type DialogRootMode = 'dialog' | 'drawer' | 'alert-dialog';
