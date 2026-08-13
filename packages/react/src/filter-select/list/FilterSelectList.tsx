'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { FilterDropdown } from '../../filter-dropdown';
import type { BaseUIEvent } from '../../internals/types';
import { useSelectRootContext } from '../../select/root/SelectRootContext';
import { selectors } from '../../select/store';
import { SelectList, type SelectListProps } from '../../select/list/SelectList';
import { useFilterDropdownRootContext } from '../../filter-dropdown/root/FilterDropdownRootContext';
import { mergeProps } from '../../merge-props';

export const FilterSelectList = React.forwardRef(function FilterSelectList(
  props: FilterSelectList.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { id: idProp, ...selectProps } = props;
  const filterContext = useFilterDropdownRootContext();
  const { store } = useSelectRootContext();
  const rootId = useStore(store, selectors.id);
  const id = idProp ?? `${rootId}-list`;

  return (
    <FilterDropdown.List
      id={id}
      role="listbox"
      render={
        <SelectList
          {...selectProps}
          id={id}
          ref={forwardedRef}
          {...mergeProps(
            {
              onKeyDown(event: React.KeyboardEvent) {
                if (event.key === 'Tab' && event.shiftKey) {
                  event.preventDefault();
                  event.stopPropagation();
                  filterContext.setActiveIndex(null);
                  filterContext.inputRef.current?.focus({ preventScroll: true });
                }
              },
              onFocus(event: BaseUIEvent<React.FocusEvent>) {
                if (
                  event.target === event.currentTarget &&
                  filterContext.listRef.current.some(Boolean)
                ) {
                  event.preventBaseUIHandler();
                  filterContext.setActiveIndex(0);
                }
              },
            },
            selectProps,
          )}
        />
      }
    />
  );
});

export interface FilterSelectListProps extends SelectListProps {}

export namespace FilterSelectList {
  export type Props = FilterSelectListProps;
  export type State = SelectList.State;
}
