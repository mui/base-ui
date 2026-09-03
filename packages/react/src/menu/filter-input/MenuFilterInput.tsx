'use client';
import * as React from 'react';
import {
  FilterDropdownInput,
  type FilterDropdownInputProps,
  type FilterDropdownInputState,
} from '../../filter-dropdown/input/FilterDropdownInput';
import { useFilterDropdownItemContext } from '../../filter-dropdown/root/FilterDropdownRootContext';
import { mergeProps } from '../../merge-props';
import type { BaseUIEvent } from '../../internals/types';
import { dispatchClickWithModifiers } from '../../utils/dispatchClickWithModifiers';
import { useMenuFilterReferenceKeyDown } from '../filter-root/useMenuFilterReferenceKeyDown';

/**
 * A search field that filters the menu items.
 * Requires the menu to be wrapped in `Menu.FilterProvider`.
 * Renders an `<input>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuFilterInput = React.forwardRef(function MenuFilterInput(
  componentProps: MenuFilterInput.Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
) {
  const { listRef, store } = useFilterDropdownItemContext();
  const activeIndex = store.useState('activeIndex');
  const handleReferenceKeyDown = useMenuFilterReferenceKeyDown();

  const inputProps = mergeProps<typeof FilterDropdownInput>(
    {
      onKeyDown(event: BaseUIEvent<React.KeyboardEvent<HTMLInputElement>>) {
        handleReferenceKeyDown(event);
        // List navigation forwards cross-axis keys to the highlighted item but leaves activation
        // keys to a typeable reference, so Enter is committed here.
        if (event.key !== 'Enter') {
          return;
        }

        // Enter that commits an IME composition belongs to the input, not the list.
        if (event.which === 229) {
          return;
        }

        const activeItem = listRef.current[activeIndex ?? -1];
        if (activeItem) {
          event.preventDefault();
          dispatchClickWithModifiers(activeItem, event);
        }
      },
    },
    componentProps,
  );

  return <FilterDropdownInput {...inputProps} ref={forwardedRef} />;
});

export interface MenuFilterInputState extends FilterDropdownInputState {}
export interface MenuFilterInputProps extends FilterDropdownInputProps {}

export namespace MenuFilterInput {
  export type State = MenuFilterInputState;
  export type Props = MenuFilterInputProps;
}
