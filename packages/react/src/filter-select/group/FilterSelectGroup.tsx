'use client';
import * as React from 'react';
import { FilterDropdown } from '../../filter-dropdown';
import { SelectGroup, type SelectGroupProps } from '../../select/group/SelectGroup';

export const FilterSelectGroup = React.forwardRef(function FilterSelectGroup(
  props: FilterSelectGroup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  return <FilterDropdown.Group render={<SelectGroup {...props} ref={forwardedRef} />} />;
});

export interface FilterSelectGroupProps extends SelectGroupProps {}

export namespace FilterSelectGroup {
  export type Props = FilterSelectGroupProps;
  export type State = SelectGroup.State;
}
