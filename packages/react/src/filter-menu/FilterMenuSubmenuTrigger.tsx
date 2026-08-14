'use client';
import * as React from 'react';
import { FilterDropdownItem } from '../filter-dropdown/item/FilterDropdownItem';
import { FilterDropdownPopupContext } from '../filter-dropdown/popup/FilterDropdownPopupContext';
import { FilterDropdownTrigger } from '../filter-dropdown/trigger/FilterDropdownTrigger';
import { useFilterDropdownRootContext } from '../filter-dropdown/root/FilterDropdownRootContext';
import {
  MenuSubmenuTrigger,
  type MenuSubmenuTriggerProps,
} from '../menu/submenu-trigger/MenuSubmenuTrigger';
import { useMenuRootContext } from '../menu/root/MenuRootContext';

export const FilterMenuSubmenuTrigger = React.forwardRef(function FilterMenuSubmenuTrigger(
  props: FilterMenuSubmenuTrigger.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const { id, label, keywords, ...submenuProps } = props;
  const { floatingId, store } = useMenuRootContext();
  const popupContext = React.useContext(FilterDropdownPopupContext);
  const nearestContext = useFilterDropdownRootContext(true);
  // The nearest root context is usually this trigger's own submenu dropdown, whose `parent`
  // owns the list the trigger belongs to. Inside a plain submenu root there is no own dropdown,
  // so the nearest context itself is the owner.
  const parentContext =
    nearestContext !== null && nearestContext.listRef === store.context.itemDomElements
      ? nearestContext.parent
      : nearestContext;

  const trigger = (
    <FilterDropdownTrigger
      id={id}
      aria-controls={floatingId}
      render={<MenuSubmenuTrigger {...submenuProps} id={id} />}
      ref={forwardedRef}
    />
  );

  // A plain parent menu roves DOM focus across its items, so the trigger stays unregistered.
  if (popupContext === null || parentContext === null) {
    return trigger;
  }

  // The trigger registers as an item of the parent dropdown so the query filters it.
  return (
    <FilterDropdownItem
      label={label}
      keywords={keywords}
      rootContext={parentContext}
      render={trigger}
    />
  );
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
