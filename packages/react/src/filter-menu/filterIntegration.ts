'use client';
import { FilterDropdownRoot } from '../filter-dropdown/root/FilterDropdownRoot';
import { FilterDropdownTrigger } from '../filter-dropdown/trigger/FilterDropdownTrigger';
import { FilterDropdownPopup } from '../filter-dropdown/popup/FilterDropdownPopup';
import { FilterDropdownList } from '../filter-dropdown/list/FilterDropdownList';
import { FilterDropdownItem } from '../filter-dropdown/item/FilterDropdownItem';
import { FilterDropdownGroup } from '../filter-dropdown/group/FilterDropdownGroup';
import type { MenuFilterIntegration } from '../menu/root/MenuFilterIntegrationContext';

/**
 * This module is the only place the filtering parts are imported. Menu reaches them through the
 * store, so `@base-ui/react/menu` never pulls them into an ordinary consumer's bundle.
 */
export const filterIntegration: MenuFilterIntegration = {
  Root: FilterDropdownRoot,
  Trigger: FilterDropdownTrigger,
  Popup: FilterDropdownPopup,
  List: FilterDropdownList,
  Item: FilterDropdownItem,
  Group: FilterDropdownGroup,
};
