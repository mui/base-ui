'use client';
import * as React from 'react';
import { useFilterDropdownPopup } from '../../filter-dropdown/popup/FilterDropdownPopup';
import { MenuPopupPlain, type MenuPopupProps, type MenuPopupState } from '../popup/MenuPopup';
import { mergeProps } from '../../merge-props';

/**
 * A container for the filter input and item list.
 * Renders a `<div>` element with a `dialog` role.
 */
export const FilteredMenuPopup = React.forwardRef(function FilteredMenuPopup(
  props: FilteredMenuPopup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const popupProps = mergeProps<typeof MenuPopupPlain>(useFilterDropdownPopup(), props);
  return <MenuPopupPlain {...popupProps} role="dialog" ref={forwardedRef} />;
});

export interface FilteredMenuPopupProps extends MenuPopupProps {}
export interface FilteredMenuPopupState extends MenuPopupState {}

export namespace FilteredMenuPopup {
  export type Props = FilteredMenuPopupProps;
  export type State = FilteredMenuPopupState;
}
