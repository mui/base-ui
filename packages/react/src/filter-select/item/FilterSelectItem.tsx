'use client';
import * as React from 'react';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { useFilterDropdownItem } from '../../filter-dropdown/item/useFilterDropdownItem';
import { SelectItem, type SelectItemProps } from '../../select/item/SelectItem';
import { useFilterSelectRootContext } from '../root/FilterSelectRootContext';

export const FilterSelectItem = React.memo(
  React.forwardRef(function FilterSelectItem(
    props: FilterSelectItem.Props,
    forwardedRef: React.ForwardedRef<HTMLElement>,
  ) {
    const { label, keywords, ...selectProps } = props;

    const { getItemData } = useFilterSelectRootContext();
    const itemValue = props.value ?? null;
    const itemData = getItemData(itemValue);
    const { visible, ref } = useFilterDropdownItem({
      label,
      keywords: keywords ?? itemData?.keywords,
      filterValue: itemData,
      children: props.children,
    });
    const mergedRef = useMergedRefs(forwardedRef, ref);

    return visible ? <SelectItem {...selectProps} label={label} ref={mergedRef} /> : null;
  }),
);

export interface FilterSelectItemProps extends SelectItemProps {
  keywords?: readonly string[] | undefined;
}

export namespace FilterSelectItem {
  export type Props = FilterSelectItemProps;
  export type State = SelectItem.State;
}
