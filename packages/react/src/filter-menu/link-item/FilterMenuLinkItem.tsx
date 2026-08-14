'use client';
import * as React from 'react';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { useFilterDropdownItem } from '../../filter-dropdown/item/useFilterDropdownItem';
import { MenuLinkItem, type MenuLinkItemProps } from '../../menu/link-item/MenuLinkItem';

export const FilterMenuLinkItem = React.forwardRef(function FilterMenuLinkItem(
  props: FilterMenuLinkItem.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const { label, keywords, ...menuProps } = props;
  const { visible, ref } = useFilterDropdownItem({ label, keywords, children: props.children });
  const mergedRef = useMergedRefs(forwardedRef, ref);

  return visible ? <MenuLinkItem {...menuProps} label={label} ref={mergedRef} /> : null;
});

export interface FilterMenuLinkItemProps extends Omit<MenuLinkItemProps, 'keywords'> {
  keywords?: readonly string[] | undefined;
}

export namespace FilterMenuLinkItem {
  export type Props = FilterMenuLinkItemProps;
  export type State = MenuLinkItem.State;
}
