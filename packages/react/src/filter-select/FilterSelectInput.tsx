'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import {
  FilterDropdownInput,
  type FilterDropdownInputProps,
  type FilterDropdownInputState,
} from '../filter-dropdown/input/FilterDropdownInput';
import { mergeProps } from '../merge-props';
import type { BaseUIEvent } from '../internals/types';
import { useSelectRootContext } from '../select/root/SelectRootContext';
import { selectors } from '../select/store';
import { useFilterDropdownRootContext } from '../filter-dropdown/root/FilterDropdownRootContext';

export const FilterSelectInput = React.forwardRef(function FilterSelectInput(
  componentProps: FilterSelectInput.Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
) {
  const context = useSelectRootContext();
  const filterContext = useFilterDropdownRootContext();
  const visibleItemIndexes = useStore(context.store, selectors.visibleItemIndexes);

  React.useEffect(() => {
    context.store.set('activeIndex', filterContext.activeIndex);
  }, [context.store, filterContext.activeIndex, visibleItemIndexes]);

  const inputProps = mergeProps<typeof FilterDropdownInput>(
    {
      onKeyDown(event: BaseUIEvent<React.KeyboardEvent<HTMLInputElement>>) {
        const activeIndex = context.store.state.activeIndex;
        const activeItem = context.listRef.current[activeIndex ?? -1];

        if (event.key === 'Enter' && activeItem) {
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
