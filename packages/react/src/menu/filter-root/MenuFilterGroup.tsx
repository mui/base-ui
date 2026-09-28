'use client';
import * as React from 'react';
import { useFilterDropdownGroup } from '../../filter-dropdown/group/useFilterDropdownGroup';
import { FilterDropdownGroupContext } from '../../filter-dropdown/group/FilterDropdownGroupContext';
import { MenuGroupPlain } from '../group/MenuGroup';
import type { MenuGroupProps } from '../group/MenuGroup';

/**
 * Groups related filter menu items with a corresponding label.
 * Renders a `<div>` element.
 */
export const MenuFilterGroup = React.forwardRef(function MenuFilterGroup(
  props: MenuGroupProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { hidden, context } = useFilterDropdownGroup();

  return (
    <FilterDropdownGroupContext.Provider value={context}>
      <MenuGroupPlain {...props} hidden={hidden || props.hidden || undefined} ref={forwardedRef} />
    </FilterDropdownGroupContext.Provider>
  );
});
