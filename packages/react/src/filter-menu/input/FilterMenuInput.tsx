'use client';
import * as React from 'react';
import {
  FilterDropdownInput,
  type FilterDropdownInputProps,
  type FilterDropdownInputState,
} from '../../filter-dropdown/input/FilterDropdownInput';
import {
  useFilterDropdownItemContext,
  useFilterDropdownActiveIndex,
} from '../../filter-dropdown/root/FilterDropdownRootContext';
import { mergeProps } from '../../merge-props';
import type { BaseUIEvent } from '../../internals/types';
import { dispatchClickWithModifiers } from '../../utils/dispatchClickWithModifiers';
import { useFilterMenuReferenceKeyDown } from '../utils/useFilterMenuReferenceKeyDown';

/**
 * A search field that filters the menu items.
 * Renders an `<input>` element.
 *
 * Documentation: [Base UI Filter Menu](https://base-ui.com/react/components/filter-menu)
 */
export const FilterMenuInput = React.forwardRef(function FilterMenuInput(
  componentProps: FilterMenuInput.Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
) {
  const activeIndex = useFilterDropdownActiveIndex();
  const { grid, listRef } = useFilterDropdownItemContext();
  const handleReferenceKeyDown = useFilterMenuReferenceKeyDown();

  const inputProps = mergeProps<typeof FilterDropdownInput>(
    {
      onKeyDown(event: BaseUIEvent<React.KeyboardEvent<HTMLInputElement>>) {
        if (
          grid &&
          activeIndex == null &&
          (event.key === 'ArrowLeft' || event.key === 'ArrowRight')
        ) {
          event.stopPropagation();
          event.preventBaseUIHandler();
          return;
        }

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

export interface FilterMenuInputState extends FilterDropdownInputState {}
export interface FilterMenuInputProps extends FilterDropdownInputProps {}

export namespace FilterMenuInput {
  export type State = FilterMenuInputState;
  export type Props = FilterMenuInputProps;
}
