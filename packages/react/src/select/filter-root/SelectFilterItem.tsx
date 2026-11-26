'use client';
import * as React from 'react';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { useFilterDropdownItem } from '../../filter-dropdown/item/useFilterDropdownItem';
import { useBaseUiId } from '../../internals/useBaseUiId';
import { mergeProps } from '../../merge-props';
import { SelectItemPlain } from '../item/SelectItem';
import type { SelectItemProps } from '../item/SelectItem';

function preventDefault(event: React.MouseEvent) {
  event.preventDefault();
}

/**
 * An option of a filterable select. The input holds real focus, so the option is never in the tab
 * order, a press on it must not move focus, and it needs an id for the input's
 * `aria-activedescendant`.
 */
export const SelectFilterItem = React.forwardRef(function SelectFilterItem(
  props: SelectItemProps,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const { visible, ref: filterRef } = useFilterDropdownItem({
    label: props.label,
    children: props.children,
    render: props.render,
  });
  const id = useBaseUiId();
  const ref = useMergedRefs(forwardedRef, filterRef);

  if (!visible) {
    return null;
  }

  const itemProps = mergeProps<typeof SelectItemPlain>(
    { id, tabIndex: -1, onMouseDown: preventDefault },
    props,
  );

  return <SelectItemPlain {...itemProps} ref={ref} />;
});
