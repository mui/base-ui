'use client';
import * as React from 'react';
import {
  FilterDropdownClear,
  type FilterDropdownClearProps,
  type FilterDropdownClearState,
} from '../../filter-dropdown/clear/FilterDropdownClear';
import { useMenuFilterPart } from '../filter-root/MenuFilterContext';

/**
 * A button that clears the input text.
 * Requires the menu to be wrapped in `Menu.FilterProvider`.
 * Renders a `<button>` element when the input has text.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuClear = React.forwardRef(function MenuClear(
  props: MenuClear.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  useMenuFilterPart('Clear');
  return <FilterDropdownClear {...props} ref={forwardedRef} />;
});

export interface MenuClearState extends FilterDropdownClearState {}
export interface MenuClearProps extends FilterDropdownClearProps {}

export namespace MenuClear {
  export type State = MenuClearState;
  export type Props = MenuClearProps;
}
