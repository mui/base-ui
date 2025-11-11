'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui-components/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { ownerDocument } from '@base-ui-components/utils/owner';
import { useTransitionStatus } from '../../utils/useTransitionStatus';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';
import { type CommandPaletteRoot } from './CommandPaletteRoot';
import { CommandPaletteStore } from '../store/CommandPaletteStore';

const LEFT_MOUSE_BUTTON = 0;

export function useCommandPaletteRoot(
  params: useCommandPaletteRoot.Parameters,
): useCommandPaletteRoot.ReturnValue {
  const { store, actionsRef } = params;

  const open = store.useState('open');
  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);

  useIsoLayoutEffect(() => {
    store.set('mounted', mounted);
    store.set('transitionStatus', transitionStatus);
  }, [store, mounted, transitionStatus]);

  const handleUnmount = useStableCallback(() => {
    setMounted(false);
    store.update({ open: false, mounted: false });
    store.context.onOpenChangeComplete?.(false);
  });

  const handleImperativeClose = React.useCallback(() => {
    store.setOpen(false, createChangeEventDetails(REASONS.imperativeAction));
  }, [store]);

  // Handle click outside to close the command palette
  React.useEffect((): (() => void) | void => {
    if (!open || !mounted) {
      return;
    }

    const popupElement = store.state.popupElement;
    if (!popupElement) {
      return;
    }

    const doc = ownerDocument(popupElement);
    const handleClickOutside = (event: MouseEvent) => {
      if (event.button !== LEFT_MOUSE_BUTTON) {
        return;
      }

      const target = event.target as Node | null;
      if (!target) {
        return;
      }

      // Check if the click is outside the popup element
      if (!popupElement.contains(target)) {
        store.setOpen(false, createChangeEventDetails(REASONS.outsidePress, event));
      }
    };

    // Use bubble phase so trigger's onClick handler runs first
    doc.addEventListener('click', handleClickOutside);

    return () => {
      doc.removeEventListener('click', handleClickOutside);
    };
  }, [open, mounted, store]);

  useOpenChangeComplete({
    open,
    ref: store.context.popupRef,
    onComplete() {
      if (!open) {
        handleUnmount();
      } else {
        store.context.onOpenChangeComplete?.(true);
      }
    },
  });

  React.useImperativeHandle(
    actionsRef,
    () => ({ unmount: handleUnmount, close: handleImperativeClose }),
    [handleUnmount, handleImperativeClose],
  );

  const createEventDetails = useStableCallback((reason: CommandPaletteRoot.ChangeEventReason) => {
    return createChangeEventDetails<CommandPaletteRoot.ChangeEventReason>(reason);
  });

  return {
    createEventDetails,
  };
}

export namespace useCommandPaletteRoot {
  export interface Parameters {
    store: CommandPaletteStore;
    actionsRef?: React.RefObject<CommandPaletteRoot.Actions>;
  }

  export interface ReturnValue {
    createEventDetails: (
      reason: CommandPaletteRoot.ChangeEventReason,
    ) => Omit<CommandPaletteRoot.ChangeEventDetails, 'preventUnmountOnClose'>;
  }
}
