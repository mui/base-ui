'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { useFilterDropdownItem } from '../../filter-dropdown/item/useFilterDropdownItem';
import { useBaseUiId } from '../../internals/useBaseUiId';
import type { SelectFilterItemParams, SelectFilterItemResult } from './SelectFilterContext';
import { useSelectFilterNavigationContext } from './SelectFilterContext';

function preventDefault(event: React.MouseEvent) {
  event.preventDefault();
}

/**
 * Registers an option with the filter. The input holds real focus, so the option is never in
 * the tab order, a press on it must not move focus, and it needs an id for the input's
 * `aria-activedescendant`.
 */
export function useFilteredSelectItem(params: SelectFilterItemParams): SelectFilterItemResult {
  const { index } = params;
  const { visible, ref: filterRef } = useFilterDropdownItem(params);
  const { virtualizedCount, registerVirtualItem } = useSelectFilterNavigationContext();
  const id = useBaseUiId();

  const elementRef = React.useRef<HTMLElement | null>(null);
  const ref = useMergedRefs(filterRef, elementRef);
  const registersAtIndex = virtualizedCount !== null && index != null;

  // A virtualized list mounts only some options, each at its position among the filtered items.
  useIsoLayoutEffect(() => {
    if (!registersAtIndex) {
      return undefined;
    }
    return registerVirtualItem(index, elementRef.current);
  }, [registersAtIndex, index, registerVirtualItem]);

  return { visible, ref, props: { id, tabIndex: -1, onMouseDown: preventDefault } };
}
