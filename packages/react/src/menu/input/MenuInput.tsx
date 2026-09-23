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
import { useMenuFilterPart } from '../filter-root/MenuFilterContext';

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
  const { listRef, store } = useFilterDropdownItemContext();

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

        const activeItem = listRef.current[store.select('activeIndex') ?? -1];
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

export interface MenuInputState extends FilterDropdownInputState {}
export interface MenuInputProps extends FilterDropdownInputProps {
  /**
   * Whether to focus the input when the menu opens on hover or with a touch or pen press.
   * Opening the menu with a click or the keyboard always focuses the input.
   * @default false
   */
  autoFocus?: boolean | undefined;
}

export namespace MenuInput {
  export type State = MenuInputState;
  export type Props = MenuInputProps;
}
