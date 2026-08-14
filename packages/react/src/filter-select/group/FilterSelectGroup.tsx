'use client';
import * as React from 'react';
import { useFilterDropdownGroup } from '../../filter-dropdown/group/useFilterDropdownGroup';
import { FilterDropdownGroupContext } from '../../filter-dropdown/group/FilterDropdownGroupContext';
import { SelectGroup, type SelectGroupProps } from '../../select/group/SelectGroup';

export const FilterSelectGroup = React.forwardRef(function FilterSelectGroup(
  props: FilterSelectGroup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { hidden, context } = useFilterDropdownGroup();

  return (
    <FilterDropdownGroupContext.Provider value={context}>
      <SelectGroup {...props} hidden={hidden || props.hidden || undefined} ref={forwardedRef} />
    </FilterDropdownGroupContext.Provider>
  );
});

export interface FilterSelectGroupProps extends SelectGroupProps {}

export namespace FilterSelectGroup {
  export type Props = FilterSelectGroupProps;
  export type State = SelectGroup.State;
}
