'use client';
import * as React from 'react';
import {
  FilterDropdownInput,
  type FilterDropdownInputProps,
  type FilterDropdownInputState,
} from '../filter-dropdown/input/FilterDropdownInput';
import { useFilterDropdownRootContext } from '../filter-dropdown/root/FilterDropdownRootContext';
import { mergeProps } from '../merge-props';
import type { BaseUIEvent } from '../internals/types';

export const FilterMenuInput = React.forwardRef(function FilterMenuInput(
  componentProps: FilterMenuInput.Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
) {
  const { listRef, activeIndex } = useFilterDropdownRootContext();

  const inputProps = mergeProps<typeof FilterDropdownInput>(
    {
      onKeyDown(event: BaseUIEvent<React.KeyboardEvent<HTMLInputElement>>) {
        // List navigation forwards cross-axis keys to the highlighted item but leaves activation
        // keys to a typeable reference, so Enter is committed here.
        if (event.key !== 'Enter') {
          return;
        }

        // Enter that commits an IME composition belongs to the input, not the list.
        const nativeEvent = event.nativeEvent as KeyboardEvent;
        if (nativeEvent.isComposing || nativeEvent.keyCode === 229) {
          return;
        }

        const activeItem = listRef.current[activeIndex ?? -1];
        if (activeItem) {
          event.preventDefault();
          activeItem.click();
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
