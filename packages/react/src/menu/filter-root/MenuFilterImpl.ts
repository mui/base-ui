import { FilteredMenuPopup } from './FilteredMenuPopup';
import { FilteredMenuList } from './FilteredMenuList';
import { FilteredMenuGroup } from './FilteredMenuGroup';
import { FilteredMenuRadioGroup } from './FilteredMenuRadioGroup';
import { useFilterDropdownItem } from '../../filter-dropdown/item/useFilterDropdownItem';
import { useFilteredMenuSubmenuTrigger } from './useFilteredMenuSubmenuTrigger';
import type { MenuFilterImpl } from './MenuFilterContext';

export const MENU_FILTER_IMPL: MenuFilterImpl = {
  Popup: FilteredMenuPopup,
  List: FilteredMenuList,
  Group: FilteredMenuGroup,
  RadioGroup: FilteredMenuRadioGroup,
  useItem: useFilterDropdownItem,
  useSubmenuTrigger: useFilteredMenuSubmenuTrigger,
};
