'use client';
import * as React from 'react';
import { useScrollLock } from '@base-ui/utils/useScrollLock';
import { EMPTY_OBJECT } from '@base-ui/utils/empty';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useDismiss } from '../../floating-ui-react';
import { contains, getTarget } from '../../floating-ui-react/utils';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { type DialogRoot } from './DialogRoot';
import { DialogStore } from '../store/DialogStore';
import {
  useImplicitActiveTrigger,
  useOpenStateTransitions,
  usePopupInteractionProps,
  usePopupRootSync,
} from '../../utils/popups';

// Process-local counter for identifying nested dialogs when reporting counts to a parent.
// This id is never rendered to the DOM, so it doesn't need to be SSR-stable.
let nestedDialogIdCounter = 0;
function getNextNestedDialogId() {
  nestedDialogIdCounter += 1;
  return `nested-dialog-${nestedDialogIdCounter}`;
}

export function useDialogRoot(params: UseDialogRootParameters): void {
  const { store, actionsRef } = params;

  const open = store.useState('open');
  usePopupRootSync(store, open);
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
}

export interface UseDialogRootParameters {
  store: DialogStore<any>;
  actionsRef?: DialogRoot.Props['actionsRef'] | undefined;
}

export function DialogInteractions({
  store,
  parentContext,
  isDrawer,
}: {
  store: DialogStore<any>;
  parentContext: DialogStore<unknown>['context'] | undefined;
  isDrawer: boolean;
}) {
  const open = store.useState('open');
  const disablePointerDismissal = store.useState('disablePointerDismissal');
  const modal = store.useState('modal');
  const popupElement = store.useState('popupElement');
  const floatingRootContext = store.useState('floatingRootContext');

  const [ownNestedOpenDialogs, setOwnNestedOpenDialogs] = React.useState(0);
  const [ownNestedOpenDrawers, setOwnNestedOpenDrawers] = React.useState(0);
  const isTopmost = ownNestedOpenDialogs === 0;

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
      // On `touchend`, `touches` is empty because the finger has lifted, so count
      // the touch points from `changedTouches` instead.
      if ('changedTouches' in event && event.changedTouches.length !== 1) {
        return false;
      }

      const target = getTarget(event) as Element | null;
      if (isTopmost && !disablePointerDismissal) {
        // Only close if the click occurred on the dialog's owning backdrop.
        // This supports multiple modal dialogs that aren't nested in the React tree:
        // https://github.com/mui/base-ui/issues/1320
        if (modal) {
          return store.context.internalBackdropRef.current || store.context.backdropRef.current
            ? store.context.internalBackdropRef.current === target ||
                store.context.backdropRef.current === target ||
                (contains(target, popupElement) && !target?.hasAttribute('data-base-ui-portal'))
            : true;
        }
        return true;
      }
      return false;
    },
    escapeKey: isTopmost,
  });

  useScrollLock(open && modal === true, popupElement);

  // Each direct child dialog reports the deepest open count in its own subtree,
  // keyed by a stable id. Aggregating with `Math.max` (rather than letting the
  // last reporter overwrite) keeps the counts correct when sibling dialogs open
  // and close independently: a closing sibling no longer zeroes the parent's
  // count while another sibling stays open.
  const nestedDialogId = useRefWithInit(getNextNestedDialogId).current;
  const nestedChildContributionsRef = useRefWithInit(
    () => new Map<string, { dialogs: number; drawers: number }>(),
  );

  function recomputeNestedCounts() {
    let dialogs = 0;
    let drawers = 0;
    nestedChildContributionsRef.current.forEach((contribution) => {
      dialogs = Math.max(dialogs, contribution.dialogs);
      drawers = Math.max(drawers, contribution.drawers);
    });
    setOwnNestedOpenDialogs(dialogs);
    setOwnNestedOpenDrawers(drawers);
  }

  // Listen for nested open/close events on this store to maintain the counts.
  store.useContextCallback('onNestedDialogOpen', (childId, dialogCount, drawerCount) => {
    nestedChildContributionsRef.current.set(childId, {
      dialogs: dialogCount,
      drawers: drawerCount,
    });
    recomputeNestedCounts();
  });

  store.useContextCallback('onNestedDialogClose', (childId) => {
    nestedChildContributionsRef.current.delete(childId);
    recomputeNestedCounts();
  });

  // Notify parent of our open/close state using parent callbacks, if any
  React.useEffect(() => {
    if (parentContext?.onNestedDialogOpen && open) {
      parentContext.onNestedDialogOpen(
        nestedDialogId,
        ownNestedOpenDialogs + 1,
        ownNestedOpenDrawers + (isDrawer ? 1 : 0),
      );
    }
    if (parentContext?.onNestedDialogClose && !open) {
      parentContext.onNestedDialogClose(nestedDialogId);
    }
    return () => {
      if (parentContext?.onNestedDialogClose && open) {
        parentContext.onNestedDialogClose(nestedDialogId);
      }
    };
  }, [isDrawer, open, ownNestedOpenDialogs, ownNestedOpenDrawers, parentContext, nestedDialogId]);

  const activeTriggerProps = dismiss.reference ?? EMPTY_OBJECT;
  const inactiveTriggerProps = dismiss.trigger ?? EMPTY_OBJECT;
  // Consumers (DialogPopup/DrawerPopup) already spread `FOCUSABLE_POPUP_PROPS`
  // directly, so the popup props only need to carry the dismiss handlers.
  const popupProps = dismiss.floating ?? EMPTY_OBJECT;

  usePopupInteractionProps(store, {
    activeTriggerProps,
    inactiveTriggerProps,
    popupProps,
    nestedOpenDialogCount: ownNestedOpenDialogs,
    nestedOpenDrawerCount: ownNestedOpenDrawers,
  });

  return null;
}
