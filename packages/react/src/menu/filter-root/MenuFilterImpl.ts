import { MenuFilterPopup } from './MenuFilterPopup';
import { MenuFilterList } from './MenuFilterList';
import { MenuFilterGroup } from './MenuFilterGroup';
import { MenuFilterRadioGroup } from './MenuFilterRadioGroup';
import { useFilterDropdownItem } from '../../filter-dropdown/item/useFilterDropdownItem';
import { useMenuFilterSubmenuTrigger } from './useMenuFilterSubmenuTrigger';
import type { MenuFilterImpl } from './MenuFilterContext';

export const MENU_FILTER_IMPL: MenuFilterImpl = {
  Popup: MenuFilterPopup,
  List: MenuFilterList,
  Group: MenuFilterGroup,
  RadioGroup: MenuFilterRadioGroup,
  useItem: useFilterDropdownItem,
  useSubmenuTrigger: useMenuFilterSubmenuTrigger,
};
