'use client';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { useFilterDropdownItem } from '../../filter-dropdown/item/useFilterDropdownItem';
import { useFilterContextForList } from '../../filter-dropdown/root/FilterDropdownRootContext';
import type { MenuFilterItemParams, MenuFilterItemResult } from './MenuFilterContext';
import { useMenuRootContext } from '../root/MenuRootContext';

/**
 * Registers a submenu trigger with the parent menu's filter and adapts it to a filterable
 * submenu: the trigger lives inside its own submenu root, but it is an item of the parent list.
 */
export function useFilteredMenuSubmenuTrigger(params: MenuFilterItemParams): MenuFilterItemResult {
  // `virtualFocus` is set only by a filterable submenu root, so it tells this trigger whether the
  // submenu it opens renders a `role="dialog"` popup or a plain `role="menu"` one. The documented
  // plain-submenu recipe relies on the latter.
  const { store, virtualFocus, virtualFocusRef } = useMenuRootContext();
  const open = store.useState('open');
  const mounted = store.useState('mounted');
  const parent = store.useState('parent');
  // The submenu root's provider shadows the enclosing one, but the trigger belongs to the list
  // it opens from, which is the parent menu's.
  const parentListRef = parent.type === 'menu' ? parent.store.context.itemDomElements : null;
  const parentContext = useFilterContextForList(parentListRef);
  const { visible, ref } = useFilterDropdownItem({
    ...params,
    context: parentContext,
    retainGroup: mounted,
  });

  // Filtering the trigger out unmounts it, leaving its submenu open with no anchor.
  useIsoLayoutEffect(() => {
    if (visible || !open) {
      return;
    }
    store.setOpen(false, createChangeEventDetails(REASONS.none));
  }, [visible, open, store]);

  const props = {
    // Omitted rather than `undefined`, which would clear the `'menu'` the root puts on every
    // trigger.
    ...(virtualFocus ? { 'aria-haspopup': 'dialog' as const } : undefined),
    onClick() {
      // Hovering opens the submenu without moving focus into it. A click on the trigger of an
      // open submenu is explicit intent to enter it, so hand its input focus.
      const focusOwner = virtualFocusRef?.current;
      if (store.select('open') && focusOwner) {
        focusOwner.focus({ preventScroll: true });
      }
    },
  };

  if (parentContext === null) {
    // A plain parent menu roves DOM focus across its items and never filters them.
    return { visible: true, ref: null, props };
  }

  return { visible: visible || mounted, ref, props };
}
