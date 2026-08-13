'use client';
import * as React from 'react';
import { FilterDropdownItem } from '../filter-dropdown/item/FilterDropdownItem';
import { FilterDropdownPopupContext } from '../filter-dropdown/popup/FilterDropdownPopupContext';
import { FilterDropdownTrigger } from '../filter-dropdown/trigger/FilterDropdownTrigger';
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
  const { floatingId } = useMenuRootContext();
  const popupContext = React.useContext(FilterDropdownPopupContext);
  const trigger = (
    <FilterDropdownTrigger
      id={id}
      aria-controls={floatingId}
      render={<MenuSubmenuTrigger {...submenuProps} id={id} tabIndex={undefined} />}
      ref={forwardedRef}
    />
  );

  if (popupContext === null) {
    return trigger;
  }

  return <FilterDropdownItem label={label} keywords={keywords} render={trigger} />;
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
