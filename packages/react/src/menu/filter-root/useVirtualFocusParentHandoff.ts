'use client';
import { ownerDocument } from '@base-ui/utils/owner';
import { activeElement, contains } from '@base-ui/utils/shadowDom';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import type { MenuParent, MenuRoot } from '../root/MenuRoot';
import type { MenuStore } from '../store/MenuStore';
import { REASONS } from '../../internals/reasons';
import type { MenuFilterParentHandoff } from './MenuFilterContext';

/**
 * A plain submenu whose parent is filterable. The parent keeps real focus on its input, so its
 * trigger never blurs and its return focus waits for this popup's exit animation. The submenu
 * hands focus and the parent's highlight back itself.
 */
export function useVirtualFocusParentHandoff(
  store: MenuStore<unknown>,
  parent: MenuParent,
  open: boolean,
  virtualFocus: boolean,
): MenuFilterParentHandoff {
  const parentStore = parent.type === 'menu' ? parent.store : null;
  const parentVirtualFocusRef = parentStore?.context.virtualFocusRef;

  const returnToParent = useStableCallback(
    (trigger: Element | null, reason: MenuRoot.ChangeEventReason | null) => {
      const focusOwner = parentVirtualFocusRef?.current;
      if (virtualFocus || store.select('open') || !parentStore?.select('open') || !focusOwner) {
        return;
      }

      if (contains(store.context.popupRef.current, activeElement(ownerDocument(focusOwner)))) {
        focusOwner.focus({ preventScroll: true });
      }

      if (
        (reason === REASONS.listNavigation || reason === REASONS.escapeKey) &&
        parentStore.state.activeIndex == null
      ) {
        parentStore.highlightItem(trigger, REASONS.keyboard);
      }
    },
  );

  useIsoLayoutEffect(() => {
    if (!open) {
      // A parent closing in the same commit, such as on an item press, syncs its controlled `open`
      // in its own layout effect, which runs after this one. An unmount can clear the trigger by
      // then, so read it now.
      const trigger = store.state.activeTriggerElement;
      const reason = store.select('lastOpenChangeReason');
      queueMicrotask(() => returnToParent(trigger, reason));
    }
  }, [open, store, returnToParent]);

  // Real focus entering this submenu is when a plain parent's trigger would blur: the parent has
  // no active item until a keyboard close hands the cursor back to the trigger.
  function handleFocus() {
    if (!virtualFocus && parentVirtualFocusRef && parentStore?.state.activeIndex != null) {
      parentStore.setActiveIndex(null, REASONS.none);
    }
  }

  return { parentVirtualFocusRef, handleFocus };
}
