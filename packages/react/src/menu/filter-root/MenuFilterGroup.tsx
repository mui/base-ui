'use client';
import * as React from 'react';
import { useFilterDropdownGroup } from '../../filter-dropdown/group/useFilterDropdownGroup';
import { FilterDropdownGroupContext } from '../../filter-dropdown/group/FilterDropdownGroupContext';
import { MenuGroupPlain } from '../group/MenuGroup';
import type { MenuGroupProps } from '../group/MenuGroup';
import { MenuRadioGroupPlain } from '../radio-group/MenuRadioGroup';
import type { MenuRadioGroupProps } from '../radio-group/MenuRadioGroup';

/**
 * `Menu.Group` in a filterable menu: hidden, label included, once the query filters out all of
 * its items.
 *
 * @internal
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

/**
 * `Menu.RadioGroup` in a filterable menu, hidden like `MenuFilterGroup`.
 *
 * @internal
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
