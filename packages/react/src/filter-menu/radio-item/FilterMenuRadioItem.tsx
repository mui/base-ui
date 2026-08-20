'use client';
import * as React from 'react';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { useFilterDropdownItem } from '../../filter-dropdown/item/useFilterDropdownItem';
import {
  MenuRadioItem,
  type MenuRadioItemProps,
  type MenuRadioItemState,
} from '../../menu/radio-item/MenuRadioItem';

/**
 * A filter menu item that selects a value in a radio group.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Filter Menu](https://base-ui.com/react/components/filter-menu)
 */
export const FilterMenuRadioItem = React.forwardRef(function FilterMenuRadioItem(
  props: FilterMenuRadioItem.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const { label, keywords, ...menuProps } = props;

  const { visible, ref } = useFilterDropdownItem({ label, keywords, children: props.children });
  const mergedRef = useMergedRefs(forwardedRef, ref);

  return visible ? <MenuRadioItem {...menuProps} label={label} ref={mergedRef} /> : null;
});

export interface FilterMenuRadioItemProps extends Omit<MenuRadioItemProps, 'label' | 'value'> {
  /**
   * The value selected in the `FilterMenu.RadioGroup` when this item is activated.
   */
  value: any;
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

export interface FilterMenuRadioItemState extends MenuRadioItemState {}

export namespace FilterMenuRadioItem {
  export type Props = FilterMenuRadioItemProps;
  export type State = FilterMenuRadioItemState;
}
