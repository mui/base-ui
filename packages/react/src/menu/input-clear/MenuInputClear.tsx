'use client';
import * as React from 'react';
import {
  FilterDropdownClear,
  type FilterDropdownClearProps,
  type FilterDropdownClearState,
} from '../../filter-dropdown/clear/FilterDropdownClear';
import { useMenuFilterPart } from '../filter-root/MenuFilterContext';

/**
 * A button that clears the filter query. Renders nothing while the query is empty.
 * Requires the menu to be wrapped in `Menu.FilterProvider`.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuInputClear = React.forwardRef(function MenuInputClear(
  props: MenuInputClear.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  useMenuFilterPart('InputClear');
  return <FilterDropdownClear {...props} ref={forwardedRef} />;
});

export interface MenuInputClearState extends FilterDropdownClearState {}
export interface MenuInputClearProps extends FilterDropdownClearProps {}

export namespace MenuInputClear {
  export type State = MenuInputClearState;
  export type Props = MenuInputClearProps;
}
