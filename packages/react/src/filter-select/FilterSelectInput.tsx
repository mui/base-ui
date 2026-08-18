'use client';
import * as React from 'react';
import {
  FilterDropdownInput,
  type FilterDropdownInputProps,
  type FilterDropdownInputState,
} from '../filter-dropdown/input/FilterDropdownInput';
import { mergeProps } from '../merge-props';
import type { BaseUIEvent } from '../internals/types';
import { useFilterDropdownRootContext } from '../filter-dropdown/root/FilterDropdownRootContext';

export const FilterSelectInput = React.forwardRef(function FilterSelectInput(
  componentProps: FilterSelectInput.Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
) {
  const { listRef, activeIndex } = useFilterDropdownRootContext();

  const inputProps = mergeProps<typeof FilterDropdownInput>(
    {
      onKeyDown(event: BaseUIEvent<React.KeyboardEvent<HTMLInputElement>>) {
        const activeItem = listRef.current[activeIndex ?? -1];

        // Enter that commits an IME composition must reach the input, not the list.
        const isComposing =
          event.nativeEvent.isComposing || (event.nativeEvent as KeyboardEvent).keyCode === 229;

        if (event.key === 'Enter' && activeItem && !isComposing) {
          event.preventDefault();
          activeItem.click();
        }
      },
    },
    componentProps,
  );

  return <FilterDropdownInput {...inputProps} ref={forwardedRef} />;
});

export interface FilterSelectInputState extends FilterDropdownInputState {}
export interface FilterSelectInputProps extends FilterDropdownInputProps {}

export namespace FilterSelectInput {
  export type State = FilterSelectInputState;
  export type Props = FilterSelectInputProps;
}
