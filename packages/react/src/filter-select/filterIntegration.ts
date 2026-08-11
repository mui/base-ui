'use client';
import { FilterDropdownRoot } from '../filter-dropdown/root/FilterDropdownRoot';
import { FilterDropdownTrigger } from '../filter-dropdown/trigger/FilterDropdownTrigger';
import { FilterDropdownPopup } from '../filter-dropdown/popup/FilterDropdownPopup';
import { FilterDropdownList } from '../filter-dropdown/list/FilterDropdownList';
import { getContainsFilter } from '../internals/filter';
import type { SelectFilterIntegration } from '../select/root/SelectFilterIntegrationContext';

/**
 * This module is the only place the filtering parts are imported. Select reaches them through the
 * store, so `@base-ui/react/select` never pulls them into an ordinary consumer's bundle.
 */
export const filterIntegration: SelectFilterIntegration = {
  Root: FilterDropdownRoot,
  Trigger: FilterDropdownTrigger,
  Popup: FilterDropdownPopup,
  List: FilterDropdownList,
  getDefaultFilter: getContainsFilter,
};
