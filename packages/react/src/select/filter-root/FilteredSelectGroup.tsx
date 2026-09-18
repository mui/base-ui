'use client';
import * as React from 'react';
import { useFilterDropdownGroup } from '../../filter-dropdown/group/useFilterDropdownGroup';
import { FilterDropdownGroupContext } from '../../filter-dropdown/group/FilterDropdownGroupContext';
import { SelectGroupPlain, type SelectGroupProps } from '../group/SelectGroup';

/**
 * Groups related filterable select items with the corresponding label.
 * Renders a `<div>` element.
 */
export const FilteredSelectGroup = React.forwardRef(function FilteredSelectGroup(
  props: SelectGroupProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { hidden, context } = useFilterDropdownGroup();

  return (
    <FilterDropdownGroupContext.Provider value={context}>
      <SelectGroupPlain
        {...props}
        hidden={hidden || props.hidden || undefined}
        ref={forwardedRef}
      />
    </FilterDropdownGroupContext.Provider>
  );
});
