'use client';
import * as React from 'react';
import { platform } from '@base-ui/utils/platform';
import { FilterDropdownInput } from '../../filter-dropdown/input/FilterDropdownInput';
import type {
  FilterDropdownInputProps,
  FilterDropdownInputState,
} from '../../filter-dropdown/input/FilterDropdownInput';
import { useFilterDropdownValueContext } from '../../filter-dropdown/root/FilterDropdownRootContext';
import { mergeProps } from '../../merge-props';
import { useMenuFilterKeyDown } from '../filter-root/useMenuFilterKeyDown';
import { useMenuFilterPart } from '../filter-root/MenuFilterContext';
import { useMenuRootContext } from '../root/MenuRootContext';

/**
 * A search field that filters the menu items.
 * Requires the menu to be wrapped in `Menu.FilterProvider`.
 * Renders an `<input>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuInput = React.forwardRef(function MenuInput(
  componentProps: MenuInput.Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
) {
  useMenuFilterPart('Input');
  const { store } = useMenuRootContext();
  const value = useFilterDropdownValueContext();

  const { onKeyDown, ...navigationProps } = store.useState('inputProps');
  const activeItemId = store.useState('highlightedItemId');

  const handleKeyDown = useMenuFilterKeyDown(value !== '');

  const inputProps = mergeProps<typeof FilterDropdownInput>(
    {
      onKeyDown: handleKeyDown,
      onFocus() {
        if (platform.engine.webkit) {
          store.set('webkitInputFocused', true);
        }
      },
      onBlur() {
        store.set('webkitInputFocused', false);
      },
    },
    componentProps,
  );

  return (
    <FilterDropdownInput
      {...inputProps}
      activeItemId={activeItemId}
      navigationProps={navigationProps}
      ref={forwardedRef}
    />
  );
});

export interface MenuInputState extends FilterDropdownInputState {}
export interface MenuInputProps extends FilterDropdownInputProps {}

export namespace MenuInput {
  export type State = MenuInputState;
  export type Props = MenuInputProps;
}
