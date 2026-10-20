'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { warn } from '@base-ui/utils/warn';
import { useFilterDropdownItem } from '../../filter-dropdown/item/useFilterDropdownItem';
import { useBaseUiId } from '../../internals/useBaseUiId';
import { mergeProps } from '../../merge-props';
import { SelectItemPlain } from '../item/SelectItem';
import type { SelectItemProps } from '../item/SelectItem';
import { useSelectFilterNavigationContext } from './SelectFilterContext';

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
  const { virtualizedCount, getVirtualIndex, registerVirtualItem } =
    useSelectFilterNavigationContext();
  const id = useBaseUiId();

  const elementRef = React.useRef<HTMLElement | null>(null);
  const ref = useMergedRefs(forwardedRef, filterRef, elementRef);
  // A virtualized list mounts only some options, each at its position among the filtered items.
  const index = virtualizedCount === null ? undefined : getVirtualIndex(props.value ?? null);

  if (process.env.NODE_ENV !== 'production' && index === -1) {
    warn(
      'A <Select.Item> in a virtualized select has a `value` that is not in the `items` of ' +
        '<Select.Root>, so it cannot be highlighted or selected with the keyboard. Render the ' +
        'items from Select.useFilteredItems() and pass each item its `value`.',
    );
  }

  useIsoLayoutEffect(() => {
    if (index === undefined || index === -1) {
      return undefined;
    }
    return registerVirtualItem(index, elementRef.current);
  }, [index, registerVirtualItem]);

  if (!visible) {
    return null;
  }

  const itemProps = mergeProps<typeof SelectItemPlain>(
    { id, index, tabIndex: -1, onMouseDown: preventDefault },
    props,
  );

  return <SelectItemPlain {...itemProps} ref={ref} />;
});
