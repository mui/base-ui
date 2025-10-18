'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui-components/utils/useStableCallback';
import {
  useClick,
  useDismiss,
  useFloatingRootContext,
  useInteractions,
  useRole,
} from '../../floating-ui-react';
import { getTarget } from '../../floating-ui-react/utils';
import { useScrollLock } from '../../utils/useScrollLock';
import { useTransitionStatus } from '../../utils/useTransitionStatus';
import { useOpenInteractionType } from '../../utils/useOpenInteractionType';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { type DialogRoot } from './DialogRoot';
import { DialogStore } from '../store';

export function useDialogRoot(params: useDialogRoot.Parameters): useDialogRoot.ReturnValue {
  const { store, parentContext } = params;

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

  const handleUnmount = useStableCallback(() => {
    setMounted(false);
    store.context.openChangeComplete?.(false);
    resetOpenInteractionType();
  });

  useOpenChangeComplete({
    enabled: !params.actionsRef,
    open,
    ref: store.context.popupRef,
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
    onOpenChange: store.setOpen,
    noEmit: true,
  });

  const [ownNestedOpenDialogs, setOwnNestedOpenDialogs] = React.useState(0);
  const isTopmost = ownNestedOpenDialogs === 0;

  const role = useRole(context);
  const click = useClick(context);
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
          return store.context.internalBackdropRef.current || store.context.backdropRef.current
            ? store.context.internalBackdropRef.current === eventTarget ||
                store.context.backdropRef.current === eventTarget
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
  store.useContextCallback('nestedDialogOpen', (ownChildrenCount) => {
    setOwnNestedOpenDialogs(ownChildrenCount + 1);
  });

  store.useContextCallback('nestedDialogClose', () => {
    setOwnNestedOpenDialogs(0);
  });

  // Notify parent of our open/close state using parent callbacks, if any
  React.useEffect(() => {
    if (parentContext?.nestedDialogOpen && open) {
      parentContext.nestedDialogOpen(ownNestedOpenDialogs);
    }
    if (parentContext?.nestedDialogClose && !open) {
      parentContext.nestedDialogClose();
    }
    return () => {
      if (parentContext?.nestedDialogClose && open) {
        parentContext.nestedDialogClose();
      }
    };
  }, [open, parentContext, ownNestedOpenDialogs]);

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

export interface UseDialogRootSharedParameters {}

export interface UseDialogRootParameters {
  store: DialogStore;
  actionsRef?: DialogRoot.Props['actionsRef'];
  parentContext?: DialogStore['context'];
  onOpenChange: DialogRoot.Props['onOpenChange'];
}

export type UseDialogRootReturnValue = void;

export namespace useDialogRoot {
  export type SharedParameters = UseDialogRootSharedParameters;
  export type Parameters = UseDialogRootParameters;
  export type ReturnValue = UseDialogRootReturnValue;
}
