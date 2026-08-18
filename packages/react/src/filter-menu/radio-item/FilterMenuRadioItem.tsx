'use client';
import * as React from 'react';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { useFilterDropdownItem } from '../../filter-dropdown/item/useFilterDropdownItem';
import { MenuRadioItem, type MenuRadioItemProps } from '../../menu/radio-item/MenuRadioItem';

export const FilterMenuRadioItem = React.forwardRef(function FilterMenuRadioItem(
  props: FilterMenuRadioItem.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const { label, keywords, ...menuProps } = props;

  const { visible, ref } = useFilterDropdownItem({ label, keywords, children: props.children });
  const mergedRef = useMergedRefs(forwardedRef, ref);

  return visible ? <MenuRadioItem {...menuProps} label={label} ref={mergedRef} /> : null;
});

export interface FilterMenuRadioItemProps extends Omit<MenuRadioItemProps, 'label' | 'keywords'> {
  /**
   * A text representation of the item used for filtering and keyboard text navigation.
   * Falls back to the rendered text.
   */
  label?: string | undefined;
  /**
   * Additional terms the item matches on when using the default filter.
   */
  keywords?: readonly string[] | undefined;
}

export namespace FilterMenuRadioItem {
  export type Props = FilterMenuRadioItemProps;
  export type State = MenuRadioItem.State;
}
