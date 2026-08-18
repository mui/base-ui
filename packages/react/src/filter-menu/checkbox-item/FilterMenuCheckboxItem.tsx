'use client';
import * as React from 'react';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { useFilterDropdownItem } from '../../filter-dropdown/item/useFilterDropdownItem';
import {
  MenuCheckboxItem,
  type MenuCheckboxItemProps,
  type MenuCheckboxItemState,
} from '../../menu/checkbox-item/MenuCheckboxItem';

/**
 * A filter menu item that toggles a setting on or off.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Filter Menu](https://base-ui.com/react/components/filter-menu)
 */
export const FilterMenuCheckboxItem = React.forwardRef(function FilterMenuCheckboxItem(
  props: FilterMenuCheckboxItem.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const { label, keywords, ...menuProps } = props;

  const { visible, ref } = useFilterDropdownItem({ label, keywords, children: props.children });
  const mergedRef = useMergedRefs(forwardedRef, ref);

  return visible ? <MenuCheckboxItem {...menuProps} label={label} ref={mergedRef} /> : null;
});

export interface FilterMenuCheckboxItemProps extends Omit<
  MenuCheckboxItemProps,
  'label' | 'onCheckedChange'
> {
  /**
   * Event handler called when the checkbox item is ticked or unticked.
   */
  onCheckedChange?:
    | ((checked: boolean, eventDetails: FilterMenuCheckboxItemChangeEventDetails) => void)
    | undefined;
  /**
   * A text representation of the item used for filtering and keyboard text navigation.
   * Falls back to the rendered text.
   */
  label?: string | undefined;
  /**
   * Additional terms the item matches on when using the default filter.
   * Ignored when a custom `filter` is provided to the root.
   */
  keywords?: readonly string[] | undefined;
}
export interface FilterMenuCheckboxItemState extends MenuCheckboxItemState {}
export type FilterMenuCheckboxItemChangeEventReason = MenuCheckboxItem.ChangeEventReason;
export type FilterMenuCheckboxItemChangeEventDetails = MenuCheckboxItem.ChangeEventDetails;

export namespace FilterMenuCheckboxItem {
  export type Props = FilterMenuCheckboxItemProps;
  export type State = FilterMenuCheckboxItemState;
  export type ChangeEventReason = FilterMenuCheckboxItemChangeEventReason;
  export type ChangeEventDetails = FilterMenuCheckboxItemChangeEventDetails;
}
