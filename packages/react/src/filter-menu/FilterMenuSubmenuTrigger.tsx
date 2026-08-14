'use client';
import * as React from 'react';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
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
  });
  const mergedRef = useMergedRefs(forwardedRef, ref);

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

  return visible ? (
    <MenuSubmenuTrigger {...submenuProps} aria-haspopup="dialog" label={label} ref={mergedRef} />
  ) : null;
});

export interface FilterMenuSubmenuTriggerProps extends Omit<
  MenuSubmenuTriggerProps,
  'id' | 'keywords'
> {
  id?: string | undefined;
  keywords?: readonly string[] | undefined;
}

export interface FilterMenuSubmenuTriggerState extends MenuSubmenuTrigger.State {}

export namespace FilterMenuSubmenuTrigger {
  export type Props = FilterMenuSubmenuTriggerProps;
  export type State = FilterMenuSubmenuTriggerState;
}
