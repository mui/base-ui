'use client';
import * as React from 'react';
import { FilterDropdown } from '../../filter-dropdown';
import { useFilterDropdownRootContext } from '../../filter-dropdown/root/FilterDropdownRootContext';
import type { BaseUIComponentProps, BaseUIEvent } from '../../internals/types';
import { mergeProps } from '../../merge-props';

export const FilterMenuList = React.forwardRef(function FilterMenuList(
  props: FilterMenuList.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { id, ...listProps } = props;
  const filterContext = useFilterDropdownRootContext();
  const mergedProps = mergeProps(
    {
      onKeyDown(event: BaseUIEvent<React.KeyboardEvent>) {
        if (event.key === 'Tab' && event.shiftKey) {
          event.preventDefault();
          event.stopPropagation();
          event.preventBaseUIHandler();
          filterContext.setActiveIndex(null);
          filterContext.inputRef.current?.focus({ preventScroll: true });
        }
      },
    },
    listProps,
  );
  const activeDescendant = filterContext.listRef.current[filterContext.activeIndex ?? -1]?.id;
  return (
    <FilterDropdown.List
      {...mergedProps}
      id={id}
      aria-activedescendant={activeDescendant}
      ref={forwardedRef}
    />
  );
});

export interface FilterMenuListState {}

export interface FilterMenuListProps extends BaseUIComponentProps<'div', FilterMenuListState> {
  id?: string | undefined;
}

export namespace FilterMenuList {
  export type Props = FilterMenuListProps;
  export type State = FilterMenuListState;
}
