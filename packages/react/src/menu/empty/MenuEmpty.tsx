'use client';
import * as React from 'react';
import {
  FilterDropdownEmpty,
  type FilterDropdownEmptyProps,
  type FilterDropdownEmptyState,
} from '../../filter-dropdown/empty/FilterDropdownEmpty';
import { useMenuFilterableRootContext } from '../root/MenuRootContext';

/**
 * Displays when no items match the current filter.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuEmpty = React.forwardRef(function MenuEmpty(
  componentProps: MenuEmpty.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  useMenuFilterableRootContext('Empty');
  return <FilterDropdownEmpty {...componentProps} ref={forwardedRef} />;
});

export interface MenuEmptyState extends FilterDropdownEmptyState {}
export interface MenuEmptyProps extends FilterDropdownEmptyProps {}

export namespace MenuEmpty {
  export type State = MenuEmptyState;
  export type Props = MenuEmptyProps;
}
