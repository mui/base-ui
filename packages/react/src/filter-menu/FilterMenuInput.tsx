'use client';
import * as React from 'react';
import {
  FilterDropdownInput,
  type FilterDropdownInputProps,
  type FilterDropdownInputState,
} from '../filter-dropdown/input/FilterDropdownInput';
import { mergeProps } from '../merge-props';
import type { BaseUIEvent } from '../internals/types';
import { useMenuRootContext } from '../menu/root/MenuRootContext';
import { useFilterDropdownRootContext } from '../filter-dropdown/root/FilterDropdownRootContext';

export const FilterMenuInput = React.forwardRef(function FilterMenuInput(
  componentProps: FilterMenuInput.Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
) {
  const { store } = useMenuRootContext();
  const filterContext = useFilterDropdownRootContext();

  React.useEffect(() => {
    const activeElement = filterContext.listRef.current[filterContext.activeIndex ?? -1];
    const menuActiveIndex = store.context.itemDomElements.current.indexOf(activeElement);
    store.set('activeIndex', menuActiveIndex === -1 ? null : menuActiveIndex);
  }, [filterContext.activeIndex, filterContext.listRef, store]);

  const inputProps = mergeProps<typeof FilterDropdownInput>(
    {
      onKeyDown(event: BaseUIEvent<React.KeyboardEvent<HTMLInputElement>>) {
        const activeItem = filterContext.listRef.current[filterContext.activeIndex ?? -1];

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

export interface FilterMenuInputState extends FilterDropdownInputState {}
export interface FilterMenuInputProps extends FilterDropdownInputProps {}

export namespace FilterMenuInput {
  export type State = FilterMenuInputState;
  export type Props = FilterMenuInputProps;
}
