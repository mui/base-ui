'use client';
import * as React from 'react';
import { useFilterDropdownGroup } from '../../filter-dropdown/group/useFilterDropdownGroup';
import { FilterDropdownGroupContext } from '../../filter-dropdown/group/FilterDropdownGroupContext';
import { MenuRadioGroupPlain, type MenuRadioGroupProps } from '../radio-group/MenuRadioGroup';

/**
 * Groups related radio items in the filter menu.
 * Renders a `<div>` element.
 */
export const MenuFilterRadioGroup = React.forwardRef(function MenuFilterRadioGroup(
  props: MenuRadioGroupProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { hidden, context } = useFilterDropdownGroup();

  return (
    <FilterDropdownGroupContext.Provider value={context}>
      <MenuRadioGroupPlain
        {...props}
        hidden={hidden || props.hidden || undefined}
        ref={forwardedRef}
      />
    </FilterDropdownGroupContext.Provider>
  );
});
