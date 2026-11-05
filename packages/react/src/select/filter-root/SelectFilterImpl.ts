import { SelectFilterPopup } from './SelectFilterPopup';
import { SelectFilterList } from './SelectFilterList';
import { SelectFilterGroup } from './SelectFilterGroup';
import { SelectFilterItem } from './SelectFilterItem';
import { useSelectFilterTriggerProps } from './useSelectFilterTriggerProps';
import type { SelectFilterImpl } from './SelectFilterContext';

export const SELECT_FILTER_IMPL: SelectFilterImpl = {
  Popup: SelectFilterPopup,
  List: SelectFilterList,
  Group: SelectFilterGroup,
  Item: SelectFilterItem,
  useTriggerProps: useSelectFilterTriggerProps,
};
