'use client';
import * as React from 'react';
import {
  FilterDropdownEmpty,
  type FilterDropdownEmptyProps,
  type FilterDropdownEmptyState,
} from '../../filter-dropdown/empty/FilterDropdownEmpty';
import { useMenuFilterPart } from '../filter-root/MenuFilterContext';

/**
 * A message shown when no items match the filter query and announced politely to screen readers.
 * Renders nothing while items match, so screen readers don't count an empty node
 * among the popup's contents.
 * Requires the menu to be wrapped in `Menu.FilterProvider`.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuEmpty = React.forwardRef(function MenuEmpty(
  props: MenuEmpty.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  useMenuFilterPart('Empty');
  return <FilterDropdownEmpty {...props} ref={forwardedRef} />;
});

export interface MenuEmptyState extends FilterDropdownEmptyState {}
export interface MenuEmptyProps extends FilterDropdownEmptyProps {}

export namespace MenuEmpty {
  export type State = MenuEmptyState;
  export type Props = MenuEmptyProps;
}
