'use client';
import * as React from 'react';
import { useFilterDropdownGroup } from '../../filter-dropdown/group/useFilterDropdownGroup';
import { FilterDropdownGroupContext } from '../../filter-dropdown/group/FilterDropdownGroupContext';
import { SelectGroupPlain } from '../group/SelectGroup';
import type { SelectGroupProps } from '../group/SelectGroup';

/**
 * `Select.Group` in a filterable select: hidden, label included, once the query filters out all
 * of its items.
 *
 * @internal
 */
export const SelectFilterGroup = React.forwardRef(function SelectFilterGroup(
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
