'use client';
import * as React from 'react';
import { FilterDropdown } from '../../filter-dropdown';
import { SelectItem, type SelectItemProps } from '../../select/item/SelectItem';
import { flattenLeafItems } from '../../internals/resolveValueLabel';
import { useFilterSelectRootContext } from '../root/FilterSelectRootContext';

export const FilterSelectItem = React.memo(
  React.forwardRef(function FilterSelectItem(
    props: FilterSelectItem.Props,
    forwardedRef: React.ForwardedRef<HTMLElement>,
  ) {
    const { label, keywords, render, ...selectProps } = props;
    const { items, isItemEqualToValue } = useFilterSelectRootContext();
    const itemValue = props.value ?? null;
    const itemData = React.useMemo(
      () =>
        flattenLeafItems(items).find((item) => isItemEqualToValue(item?.value ?? null, itemValue)),
      [isItemEqualToValue, itemValue, items],
    );

    return (
      <FilterDropdown.Item
        label={label}
        keywords={keywords ?? itemData?.keywords}
        filterValue={itemData}
        role="option"
        render={
          <SelectItem {...selectProps} tabIndex={undefined} ref={forwardedRef} render={render} />
        }
      />
    );
  }),
);

export interface FilterSelectItemProps extends SelectItemProps {
  keywords?: readonly string[] | undefined;
}

export namespace FilterSelectItem {
  export type Props = FilterSelectItemProps;
  export type State = SelectItem.State;
}
