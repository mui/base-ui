import { FilteredSelectPopup } from './FilteredSelectPopup';
import { FilteredSelectList } from './FilteredSelectList';
import { FilteredSelectGroup } from './FilteredSelectGroup';
import { useFilteredSelectItem } from './useFilteredSelectItem';
import type { SelectFilterImpl } from './SelectFilterContext';

export const SELECT_FILTER_IMPL: SelectFilterImpl = {
  Popup: FilteredSelectPopup,
  List: FilteredSelectList,
  Group: FilteredSelectGroup,
  useItem: useFilteredSelectItem,
};
