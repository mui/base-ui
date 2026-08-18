'use client';
import * as React from 'react';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { useFilterDropdownItem } from '../../filter-dropdown/item/useFilterDropdownItem';
import {
  MenuLinkItem,
  type MenuLinkItemProps,
  type MenuLinkItemState,
} from '../../menu/link-item/MenuLinkItem';

/**
 * A link in the filter menu.
 * Renders an `<a>` element.
 *
 * Documentation: [Base UI Filter Menu](https://base-ui.com/react/components/filter-menu)
 */
export const FilterMenuLinkItem = React.forwardRef(function FilterMenuLinkItem(
  props: FilterMenuLinkItem.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const { label, keywords, ...menuProps } = props;

  const { visible, ref } = useFilterDropdownItem({ label, keywords, children: props.children });
  const mergedRef = useMergedRefs(forwardedRef, ref);

  return visible ? <MenuLinkItem {...menuProps} label={label} ref={mergedRef} /> : null;
});

export interface FilterMenuLinkItemProps extends Omit<MenuLinkItemProps, 'label'> {
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
export interface FilterMenuLinkItemState extends MenuLinkItemState {}

export namespace FilterMenuLinkItem {
  export type Props = FilterMenuLinkItemProps;
  export type State = FilterMenuLinkItemState;
}
