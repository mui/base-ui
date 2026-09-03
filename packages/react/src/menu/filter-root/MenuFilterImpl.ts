import { FilteredMenuPopup } from './FilteredMenuPopup';
import { FilteredMenuGroup } from './FilteredMenuGroup';
import { FilteredMenuRadioGroup } from './FilteredMenuRadioGroup';
import { useFilteredMenuItem } from './useFilteredMenuItem';
import { useFilteredMenuSubmenuTrigger } from './useFilteredMenuSubmenuTrigger';
import type { MenuFilterImpl } from './MenuFilterContext';

export const MENU_FILTER_IMPL: MenuFilterImpl = {
  Popup: FilteredMenuPopup,
  Group: FilteredMenuGroup,
  RadioGroup: FilteredMenuRadioGroup,
  useItem: useFilteredMenuItem,
  useSubmenuTrigger: useFilteredMenuSubmenuTrigger,
};
