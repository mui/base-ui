'use client';
import * as React from 'react';
import { useFilterDropdownGroup } from '../../filter-dropdown/group/useFilterDropdownGroup';
import { FilterDropdownGroupContext } from '../../filter-dropdown/group/FilterDropdownGroupContext';
import {
  MenuRadioGroup,
  type MenuRadioGroupProps,
  type MenuRadioGroupState,
} from '../../menu/radio-group/MenuRadioGroup';

/**
 * Groups related radio items in the filter menu.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Filter Menu](https://base-ui.com/react/components/filter-menu)
 */
export const FilterMenuRadioGroup = React.forwardRef(function FilterMenuRadioGroup(
  props: FilterMenuRadioGroup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { hidden, context } = useFilterDropdownGroup();

  return (
    <FilterDropdownGroupContext.Provider value={context}>
      <MenuRadioGroup {...props} hidden={hidden || props.hidden || undefined} ref={forwardedRef} />
    </FilterDropdownGroupContext.Provider>
  );
});

export interface FilterMenuRadioGroupProps extends Omit<MenuRadioGroupProps, 'onValueChange'> {
  /**
   * Function called when the selected value changes.
   */
  onValueChange?:
    ((value: any, eventDetails: FilterMenuRadioGroupChangeEventDetails) => void) | undefined;
}

export interface FilterMenuRadioGroupState extends MenuRadioGroupState {}
export type FilterMenuRadioGroupChangeEventReason = MenuRadioGroup.ChangeEventReason;
export type FilterMenuRadioGroupChangeEventDetails = MenuRadioGroup.ChangeEventDetails;

export namespace FilterMenuRadioGroup {
  export type Props = FilterMenuRadioGroupProps;
  export type State = FilterMenuRadioGroupState;
  export type ChangeEventReason = FilterMenuRadioGroupChangeEventReason;
  export type ChangeEventDetails = FilterMenuRadioGroupChangeEventDetails;
}
