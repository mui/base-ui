'use client';
import * as React from 'react';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { createChangeEventDetails } from '../internals/createBaseUIEventDetails';
import { REASONS } from '../internals/reasons';
import { useFilterDropdownItem } from '../filter-dropdown/item/useFilterDropdownItem';
import { useFilterContextForList } from '../filter-dropdown/root/FilterDropdownRootContext';
import {
  MenuSubmenuTrigger,
  type MenuSubmenuTriggerProps,
} from '../menu/submenu-trigger/MenuSubmenuTrigger';
import { useMenuRootContext } from '../menu/root/MenuRootContext';

export const FilterMenuSubmenuTrigger = React.forwardRef(function FilterMenuSubmenuTrigger(
  props: FilterMenuSubmenuTrigger.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const { label, keywords, ...submenuProps } = props;

  const { store } = useMenuRootContext();
  const open = store.useState('open');
  const mounted = store.useState('mounted');
  const parent = store.useState('parent');
  // The trigger sits inside its own submenu's root, whose provider shadows the enclosing one, but
  // it is an item of the list it opens from, which belongs to the parent menu.
  const parentListRef = parent.type === 'menu' ? parent.store.context.itemDomElements : null;
  const parentContext = useFilterContextForList(parentListRef);
  const { visible, ref } = useFilterDropdownItem({
    label,
    keywords,
    children: props.children,
    context: parentContext,
    retainGroup: mounted,
  });
  const mergedRef = useMergedRefs(forwardedRef, ref);

  // Filtering the trigger out unmounts it, leaving its submenu open with no anchor.
  useIsoLayoutEffect(() => {
    if (visible || !open) {
      return;
    }
    store.setOpen(false, createChangeEventDetails(REASONS.none));
  }, [visible, open, store]);

  if (parentContext === null) {
    // A plain parent menu roves DOM focus across its items and never filters them.
    return (
      <MenuSubmenuTrigger
        {...submenuProps}
        aria-haspopup="dialog"
        label={label}
        ref={forwardedRef}
      />
    );
  }

  return visible || mounted ? (
    <MenuSubmenuTrigger {...submenuProps} aria-haspopup="dialog" label={label} ref={mergedRef} />
  ) : null;
});

export interface FilterMenuSubmenuTriggerProps extends Omit<
  MenuSubmenuTriggerProps,
  'id' | 'label' | 'keywords'
> {
  id?: string | undefined;
  /**
   * A text representation of the item used for filtering and keyboard text navigation.
   * Falls back to the rendered text.
   */
  label?: string | undefined;
  /**
   * Additional terms the item matches on when using the default filter.
   */
  keywords?: readonly string[] | undefined;
}

export interface FilterMenuSubmenuTriggerState extends MenuSubmenuTrigger.State {}

export namespace FilterMenuSubmenuTrigger {
  export type Props = FilterMenuSubmenuTriggerProps;
  export type State = FilterMenuSubmenuTriggerState;
}
