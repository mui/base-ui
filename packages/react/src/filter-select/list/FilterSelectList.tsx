'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { FilterDropdownList } from '../../filter-dropdown/list/FilterDropdownList';
import { useSelectRootContext } from '../../select/root/SelectRootContext';
import { selectors, suffixId } from '../../select/store';
import { SelectList, type SelectListProps } from '../../select/list/SelectList';

export const FilterSelectList = React.forwardRef(function FilterSelectList(
  props: FilterSelectList.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { id: idProp, ...selectProps } = props;

  const { store } = useSelectRootContext();
  const rootId = useStore(store, selectors.id);
  const id = idProp ?? suffixId(rootId, 'list');

  return (
    <FilterDropdownList
      id={id}
      role="listbox"
      render={<SelectList {...selectProps} id={id} ref={forwardedRef} />}
    />
  );
});

export interface FilterSelectListProps extends SelectListProps {}

export namespace FilterSelectList {
  export type Props = FilterSelectListProps;
  export type State = SelectList.State;
}
